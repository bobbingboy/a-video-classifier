## ADDED Requirements

### Requirement: Preset 定義檔存於 Backend
系統 SHALL 在 `backend/scrapers/presets/jav_databases.json` 中定義推薦的 AV 資料庫來源集，包含現有四個 scraper 的完整設定（JavBus、JavDB、Avsox、JavLib）。

Preset 格式：
```json
{
  "name": "AV 資料庫推薦來源",
  "sources": [
    {
      "name": "JavBus",
      "parse_mode": "builtin",
      "builtin_key": "javbus",
      "base_urls": ["https://www.seedmm.bond", "https://www.javsee.bond", "https://www.javbus.com"],
      "access_mode": "direct"
    }
  ]
}
```

#### Scenario: Preset 檔案結構正確
- **WHEN** 系統啟動或 API 呼叫 preset 資訊
- **THEN** 系統可正確讀取 `jav_databases.json` 並解析 sources 陣列

---

### Requirement: 使用者可列出可用 Preset
系統 SHALL 提供 `GET /api/scrapers/presets` 端點，回傳可用的 preset 清單（名稱、包含來源數、是否已匯入）。

#### Scenario: 列出 Preset
- **WHEN** 前端呼叫 `GET /api/scrapers/presets`
- **THEN** 系統回傳陣列，每項包含 `name`、`source_count`、`already_imported`（若 DB 中已有同名來源則為 true）

---

### Requirement: 使用者可匯入 Preset
系統 SHALL 提供 `POST /api/scrapers/presets/{preset_name}/import` 端點，將 preset 中的所有來源寫入 DB。已存在同名來源的項目 SHALL 跳過（不覆蓋）。

#### Scenario: 匯入全新 Preset
- **WHEN** 使用者點擊「匯入推薦來源」且 DB 中無同名來源
- **THEN** 系統建立所有 preset 來源，每個來源初始化對應的 stats 記錄，回傳 `{ imported: N, skipped: 0 }`

#### Scenario: 部分已存在時匯入
- **WHEN** 使用者匯入 preset，其中部分來源名稱已存在於 DB
- **THEN** 系統匯入不存在的來源，跳過已存在的，回傳 `{ imported: M, skipped: K }`

---

### Requirement: 前端首次使用時顯示 Preset 引導
當「搜尋來源」Tab 中來源列表為空時，前端 SHALL 顯示空白狀態引導介面，包含說明文字與「匯入推薦來源」按鈕。匯入完成後列表自動重新載入。

#### Scenario: 首次進入空列表
- **WHEN** 使用者開啟「搜尋來源」Tab 且系統無任何來源設定
- **THEN** 顯示說明文字「尚未設定任何搜尋來源」及「匯入推薦來源」按鈕

#### Scenario: 點擊匯入後列表更新
- **WHEN** 使用者點擊「匯入推薦來源」且匯入成功
- **THEN** 前端自動重新載入來源列表，顯示新匯入的來源
