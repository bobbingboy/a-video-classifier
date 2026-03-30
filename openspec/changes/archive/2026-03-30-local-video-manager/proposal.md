## Why

管理硬碟中大量影片檔案時，缺乏系統性的方式來查看演員、分類、封面等詳細資訊。影片檔案本身已含有番號，但目前只能靠檔名識別，無法有效搜尋或瀏覽。

## What Changes

- 新增番號解析器，從影片檔名自動提取番號（如 `SSIS-123`）
- 新增爬蟲機制，根據番號從 Javbus/JavDB 抓取 metadata（標題、演員、封面、出版商、分類）
- 新增 AI fallback（OpenRouter Perplexity Sonar），處理爬蟲查不到的番號
- 封面圖片下載並儲存至本地 `covers/` 資料夾
- 新增 SQLite 資料庫儲存所有影片 metadata
- 新增 FastAPI 後端提供 REST API
- 新增 React + TypeScript 前端介面，支援瀏覽、搜尋、過濾

## Capabilities

### New Capabilities

- `file-scanning`: 掃描指定資料夾，解析影片檔名中的番號，建立本地檔案清單
- `metadata-fetching`: 根據番號從網路來源抓取影片完整 metadata，包含 AI fallback 機制
- `cover-management`: 下載封面圖片至本地，管理本地封面路徑
- `video-library`: SQLite 資料庫核心，儲存影片、演員、分類、出版商的關聯資料
- `library-api`: FastAPI REST API，提供影片資料的 CRUD 操作與查詢
- `library-ui`: React 前端介面，支援封面瀏覽、關鍵字搜尋、演員/分類過濾、metadata 手動編輯

### Modified Capabilities

## Impact

- 需要安裝 Python 3.11+ 環境與相關套件（FastAPI、httpx、BeautifulSoup4、SQLAlchemy）
- 需要安裝 Node.js 相關工具（Vite、React、TypeScript）
- 需要 OpenRouter API key 以使用 AI fallback
- 系統僅在本地執行，不涉及任何外部部署
- 硬碟需額外空間儲存封面圖片（估計 1000 部 × 平均 200KB = ~200MB）
