## ADDED Requirements

### Requirement: 使用者可查看所有搜尋來源
系統 SHALL 提供一個 API 端點（`GET /api/scrapers/sources`），回傳所有設定的搜尋來源，包含名稱、啟用狀態、parse_mode、以及最新的 stats（成功率、冷卻狀態）。前端 SHALL 在 ScanPage 的第三個 Tab「搜尋來源」中以列表形式呈現。

#### Scenario: 有設定來源時開啟 Tab
- **WHEN** 使用者開啟「搜尋來源」Tab
- **THEN** 系統顯示每個來源的名稱、成功率進度條、啟用/停用狀態、以及是否在冷卻中

#### Scenario: 無來源時開啟 Tab
- **WHEN** 使用者第一次開啟「搜尋來源」Tab 且 DB 中無任何來源
- **THEN** 系統顯示空白提示訊息並提供「匯入推薦來源」按鈕

---

### Requirement: 使用者可新增搜尋來源
系統 SHALL 提供 `POST /api/scrapers/sources` 端點，接受完整的來源設定並寫入 DB。前端 SHALL 提供「新增來源」按鈕與表單。

表單必填欄位：
- `name`：顯示名稱（唯一）
- `parse_mode`：`builtin` 或 `selectors`
- `base_urls`：至少一個 URL
- `access_mode`：`direct` 或 `search`

當 `parse_mode = builtin` 時，`builtin_key` 為必填。
當 `parse_mode = selectors` 時，`selectors` JSON 為必填。
當 `access_mode = search` 時，`search_url_pattern`、`result_link_selector`、`result_code_selector` 為必填。

#### Scenario: 新增 builtin 來源
- **WHEN** 使用者填寫 name、parse_mode=builtin、builtin_key、base_urls 並送出
- **THEN** 系統建立來源記錄，預設 enabled=true，並以 weight=1.0 初始化 stats

#### Scenario: 新增 selectors 來源
- **WHEN** 使用者填寫 name、parse_mode=selectors、selectors JSON、base_urls 並送出
- **THEN** 系統驗證 selectors JSON 格式後建立記錄

#### Scenario: 名稱重複
- **WHEN** 使用者送出的 name 與已存在的來源相同
- **THEN** 系統回傳 422 錯誤，前端顯示「名稱已存在」提示

---

### Requirement: 使用者可編輯搜尋來源
系統 SHALL 提供 `PUT /api/scrapers/sources/{id}` 端點，允許更新所有可設定欄位。Stats 資料（attempts、successes 等）不可透過此端點修改。

#### Scenario: 更新 base_urls
- **WHEN** 使用者修改某來源的備用域名列表並儲存
- **THEN** 系統更新 DB 記錄，下次 fetch 即使用新的域名列表

#### Scenario: 切換啟用狀態
- **WHEN** 使用者將某來源設為停用（enabled=false）
- **THEN** dispatcher 在下次執行時跳過該來源

---

### Requirement: 使用者可刪除搜尋來源
系統 SHALL 提供 `DELETE /api/scrapers/sources/{id}` 端點，同時刪除關聯的 stats 記錄。

#### Scenario: 刪除來源
- **WHEN** 使用者點擊刪除並確認
- **THEN** 系統從 DB 移除該來源及其 stats，列表即時更新

---

### Requirement: DB 模型結構
系統 SHALL 使用以下資料模型：

`scraper_sources` 資料表：
- `id`: Integer PK
- `name`: String, unique, not null
- `enabled`: Boolean, default true
- `priority`: Integer（保留欄位，目前由 weight 決定排序）
- `parse_mode`: String（`builtin` | `selectors`）
- `builtin_key`: String nullable
- `base_urls`: JSON（字串陣列）
- `access_mode`: String（`direct` | `search`）
- `search_url_pattern`: String nullable
- `result_link_selector`: String nullable
- `result_code_selector`: String nullable
- `selectors`: JSON nullable
- `created_at`: DateTime

`scraper_stats` 資料表：
- `id`: Integer PK
- `source_id`: Integer FK → scraper_sources.id（cascade delete）
- `attempts`: Integer default 0
- `successes`: Integer default 0
- `consecutive_failures`: Integer default 0
- `cooldown_until`: DateTime nullable
- `last_attempt`: DateTime nullable

#### Scenario: Cascade delete stats
- **WHEN** 來源被刪除
- **THEN** 對應的 stats 記錄也一併刪除
