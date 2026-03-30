## Context

這是一個純本地執行的個人影片管理工具。使用者硬碟中有約 1000 部影片，檔名已含番號（如 `SSIS-123.mp4`）。目前缺乏任何 metadata 管理機制，需要從零建立完整的系統，包含環境安裝。

## Goals / Non-Goals

**Goals:**
- 從影片檔名自動解析番號並抓取完整 metadata
- 本地 SQLite 儲存所有資料，封面圖片下載至本地
- React UI 支援瀏覽、搜尋、過濾、手動編輯
- 爬蟲查不到時自動 fallback 到 AI 搜尋

**Non-Goals:**
- 雲端部署或多使用者支援
- 影片播放功能（僅管理 metadata）
- 自動重新命名影片檔案

## Decisions

### 1. 後端語言：Python + FastAPI（而非 Java Spring Boot）

Python 在爬蟲生態系（httpx、BeautifulSoup、Playwright）上遠比 Java 成熟。FastAPI 啟動快、boilerplate 少，適合個人工具。SQLite 在 Python 有原生支援。

**捨棄 Spring Boot 的理由**：JVM 啟動慢、打包體積大、SQLite 整合需額外設定、爬蟲生態薄弱。

### 2. 資料庫：SQLite（而非 PostgreSQL/MySQL）

單一 `.db` 檔案，無需安裝 DB server，備份容易，完全符合本地個人工具的需求。使用 SQLAlchemy ORM 管理 schema，保留未來遷移到其他 DB 的彈性。

### 3. 爬蟲目標：Javbus 為主，JavDB 為輔

Javbus 資料較完整且無需登入。JavDB 作為備用來源。兩者皆用 httpx + BeautifulSoup 解析靜態 HTML，避免引入 Playwright（減少複雜度），若未來遇到動態頁面再升級。

### 4. AI Fallback：OpenRouter Perplexity Sonar Small

僅用於爬蟲兩個來源皆失敗的情境。Perplexity Sonar Small 有即時網路搜尋能力，費用極低（1000 部影片全 fallback 約 $0.16）。回傳結果需解析為結構化 JSON，需加入 prompt engineering 確保格式一致。

### 5. 封面圖片：下載至本地 `covers/` 資料夾

以番號為檔名（如 `covers/SSIS-123.jpg`），避免依賴外部 URL，離線也能正常顯示。DB 同時儲存原始 URL（備查）與本地路徑。

### 6. 前端：React + TypeScript + Vite（而非 Electron）

不需要 Electron 的原生 API（影片播放、系統整合），Local Web App 開發速度更快，React 生態豐富。後端 FastAPI 提供靜態檔案服務（covers/），前端直接存取即可。

### 7. 專案結構：前後端分離，單一 repo

```
a-video-classifier/
├── backend/          # Python FastAPI
│   ├── main.py
│   ├── models.py     # SQLAlchemy models
│   ├── scrapers/     # Javbus, JavDB, AI fallback
│   ├── api/          # FastAPI routers
│   └── database.py
├── frontend/         # React + Vite
│   ├── src/
│   └── vite.config.ts
├── covers/           # 下載的封面圖片
└── videos.db         # SQLite 資料庫
```

## Risks / Trade-offs

- **爬蟲維護成本**：Javbus/JavDB 網站結構改變時需更新解析邏輯。→ 將爬蟲邏輯封裝成獨立模組，方便替換。
- **番號解析覆蓋率**：非標準命名的檔案可能無法解析番號。→ 未解析的檔案標記為 `unmatched`，允許手動輸入番號。
- **AI Fallback 內容政策**：部分 LLM 可能拒絕回應成人內容相關查詢。→ Perplexity Sonar 限制較寬鬆；若失敗則標記為需手動處理。
- **封面圖片版權**：下載封面僅供個人本地使用。→ 屬個人使用範疇，不涉及公開散布。

## Open Questions

- Javbus 在不同地區的可達性問題是否需要加入 proxy 支援？（初版先不處理）
- 番號變體格式（如 `FC2-PPV-1234567`、`CARIB-123456`）的解析規則需在實作時逐步補充
