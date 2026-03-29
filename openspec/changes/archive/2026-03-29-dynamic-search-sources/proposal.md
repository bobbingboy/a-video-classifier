## Why

目前的 scraper 來源（JavBus、JavDB、Avsox、JavLib）硬編碼在 Python 檔案中，無法從 UI 管理，也無法根據各來源的實際成效動態調整優先順序；隨著專案朝向通用化影片管理工具發展，搜尋來源必須成為可由用戶設定的資料，而非固定的程式邏輯。

## What Changes

- **新增** 搜尋來源設定資料模型（`ScraperSource`、`ScraperStats`）取代硬編碼的 scraper 列表
- **新增** 動態 dispatcher：從 DB 讀取啟用的來源，按 weight 排序執行，冷卻中的來源自動跳過
- **新增** 來源統計追蹤：每次 fetch 後更新成功/失敗次數，連續失敗超過 barrier 後自動進入冷卻期
- **新增** 前端「搜尋來源」管理 Tab（位於 ScanPage），支援新增、編輯、啟用/停用來源
- **新增** CSS Selectors 自訂解析模式，讓開發者可設定任意網站的欄位對應
- **新增** Preset 匯入機制：首次使用時提示一鍵匯入推薦的 AV 資料庫來源
- **移除** 舊版硬編碼 dispatcher 邏輯（四個 scraper 的固定平行呼叫與固定合併順序）

## Capabilities

### New Capabilities

- `scraper-source-management`: 搜尋來源的 CRUD 管理，包含 DB 模型、後端 API、以及前端管理 UI（新 Tab）
- `scraper-weight-cooldown`: 動態權重與冷卻機制——追蹤各來源的成功率，連續失敗超過 barrier 後進入冷卻期，影響 dispatcher 的來源選擇
- `scraper-preset`: 預設來源集的定義與一鍵匯入，用於首次安裝引導

### Modified Capabilities

(none — 現有 specs 目錄為空)

## Impact

- **Backend**:
  - `backend/models.py`：新增 `ScraperSource`、`ScraperStats` 模型
  - `backend/scrapers/dispatcher.py`：重構為動態讀取 DB 來源
  - `backend/api/`：新增 `scrapers.py` API 路由（CRUD + stats + preset import）
  - `backend/scrapers/*.py`：現有 scraper 邏輯保留，以 `builtin_key` 方式被 dispatcher 呼叫
- **Frontend**:
  - `frontend/src/pages/ScanPage.tsx`：新增第三個 Tab「搜尋來源」
  - `frontend/src/api/`：新增 scrapers API client
- **DB**：新增兩張資料表，需要 migration
