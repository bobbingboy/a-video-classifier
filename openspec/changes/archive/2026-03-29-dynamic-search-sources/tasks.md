## 1. DB 模型與 Migration

- [x] 1.1 在 `backend/models.py` 新增 `ScraperSource` 模型（含所有欄位：name、enabled、parse_mode、builtin_key、base_urls JSON、access_mode、search_url_pattern、result_link_selector、result_code_selector、selectors JSON、created_at）
- [x] 1.2 在 `backend/models.py` 新增 `ScraperStats` 模型（含 source_id FK、attempts、successes、consecutive_failures、cooldown_until、last_attempt），設定 cascade delete
- [x] 1.3 執行 DB migration（Alembic 或直接建表），確認兩張新資料表存在

## 2. Preset 定義檔

- [x] 2.1 建立 `backend/scrapers/presets/jav_databases.json`，包含 JavBus、JavDB、Avsox、JavLib 四個來源的完整設定（base_urls、access_mode、parse_mode、builtin_key 等）

## 3. Backend API — 搜尋來源 CRUD

- [x] 3.1 建立 `backend/api/scrapers.py`，新增 `GET /api/scrapers/sources`（回傳來源列表，含計算欄位 success_rate、in_cooldown、cooldown_until）
- [x] 3.2 新增 `POST /api/scrapers/sources`（建立來源，同時初始化 ScraperStats，name 重複時回傳 422）
- [x] 3.3 新增 `PUT /api/scrapers/sources/{id}`（更新來源設定，不允許修改 stats 欄位）
- [x] 3.4 新增 `DELETE /api/scrapers/sources/{id}`（刪除來源及關聯 stats）
- [x] 3.5 在 `backend/main.py` 中 include scrapers router

## 4. Backend API — Preset 匯入

- [x] 4.1 新增 `GET /api/scrapers/presets`（讀取 presets 目錄，回傳可用 preset 清單含 already_imported 狀態）
- [x] 4.2 新增 `POST /api/scrapers/presets/{preset_name}/import`（批次匯入，同名來源跳過，回傳 `{ imported, skipped }`）

## 5. Dispatcher 重構

- [x] 5.1 建立通用 selectors 解析引擎（`backend/scrapers/selector_engine.py`）：支援 direct/search 兩種 access_mode，依 selectors JSON 提取 title、cover_url、studio、release_date、actors（multiple）、tags（multiple）
- [x] 5.2 重構 `backend/scrapers/dispatcher.py`：從 DB 動態讀取 enabled 來源，過濾冷卻中的來源，按 weight 排序後平行執行
- [x] 5.3 實作 stats 更新邏輯：fetch 成功後 successes++、consecutive_failures=0；失敗後 consecutive_failures++；超過 FAILURE_BARRIER 時設定 cooldown_until
- [x] 5.4 實作結果合併：以 weight 決定欄位優先順序（取代原本的固定優先順序）
- [x] 5.5 支援 `builtin` parse_mode：以 builtin_key 動態 import 對應的 scraper 模組（`javbus`、`javdb`、`avsox`、`javlib`），調用其 `fetch(code)` 函式

## 6. Frontend — 搜尋來源 Tab

- [x] 6.1 在 `frontend/src/api/` 新增 scrapers API client（包含 getSources、createSource、updateSource、deleteSource、getPresets、importPreset）
- [x] 6.2 在 `ScanPage.tsx` 新增第三個 Tab「搜尋來源」
- [x] 6.3 實作 `SourcesTab` 元件：顯示來源列表（名稱、成功率進度條、冷卻狀態 chip、啟用/停用 toggle、編輯/刪除按鈕）
- [x] 6.4 實作空白狀態引導：無來源時顯示說明文字與「匯入推薦來源」按鈕，匯入成功後自動重新載入
- [x] 6.5 實作新增/編輯來源表單（Dialog）：依 parse_mode 動態顯示對應欄位（builtin_key 或 selectors JSON textarea）；access_mode=search 時顯示額外的 selector 欄位
