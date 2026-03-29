## 1. 環境建置

- [ ] 1.1 安裝 Python 3.11+（從 python.org 下載安裝，確認 `python --version`）  ← 需手動操作
- [ ] 1.2 安裝 pip 套件管理工具並升級至最新版（`python -m pip install --upgrade pip`）  ← 需手動操作
- [x] 1.3 建立專案目錄結構（`backend/`、`frontend/`、`covers/`）
- [ ] 1.4 在 `backend/` 建立 Python 虛擬環境（`python -m venv venv`）
- [ ] 1.5 安裝後端相依套件：`fastapi uvicorn sqlalchemy httpx beautifulsoup4 python-dotenv openai`
- [x] 1.6 建立 `backend/requirements.txt`
- [ ] 1.7 用 Vite 建立 React + TypeScript 前端專案（`npm create vite@latest frontend -- --template react-ts`）
- [ ] 1.8 安裝前端相依套件：`axios react-query`（在 `frontend/` 執行 `npm install`）
- [x] 1.9 建立 `.env` 檔案範本，包含 `OPENROUTER_API_KEY` 與 `VIDEOS_FOLDER` 欄位

## 2. 資料庫與核心模型

- [x] 2.1 建立 `backend/database.py`，設定 SQLAlchemy + SQLite 連線（資料庫檔案：`videos.db`）
- [x] 2.2 建立 `backend/models.py`，定義 `Video`、`Actor`、`Tag`、`Studio`、`VideoActor`、`VideoTag` ORM 模型
- [x] 2.3 實作 `init_db()` 函式，在啟動時自動建立所有資料表
- [x] 2.4 建立 `backend/schemas.py`，定義 Pydantic request/response schemas

## 3. 檔案掃描與番號解析

- [x] 3.1 建立 `backend/scanner.py`，實作遞迴掃描資料夾取得影片檔案清單（支援 `.mp4`、`.mkv`、`.avi`、`.wmv`、`.mov`）
- [x] 3.2 實作番號解析函式，支援標準格式（`SSIS-123`）、帶括號格式（`[SSIS-123]`）、無破折號格式（`SSIS123`）
- [x] 3.3 實作掃描去重邏輯，比對資料庫中已存在的 `file_path`，跳過已處理的影片
- [x] 3.4 將無法解析番號的檔案以 `status=unmatched` 寫入資料庫

## 4. Metadata 爬蟲

- [x] 4.1 建立 `backend/scrapers/javbus.py`，實作以番號查詢 Javbus 並解析標題、演員、出版商、分類、發行日期、封面 URL
- [x] 4.2 建立 `backend/scrapers/javdb.py`，實作以番號查詢 JavDB 作為備用來源
- [x] 4.3 建立 `backend/scrapers/ai_fallback.py`，實作透過 OpenRouter Perplexity Sonar Small 查詢並解析結構化 JSON 回應
- [x] 4.4 建立 `backend/scrapers/dispatcher.py`，實作查詢順序邏輯：Javbus → JavDB → AI fallback → `needs_manual_review`
- [x] 4.5 實作封面圖片下載函式，以番號為檔名儲存至 `covers/` 資料夾，並處理下載失敗情況

## 5. FastAPI 後端

- [x] 5.1 建立 `backend/main.py`，初始化 FastAPI app，掛載靜態檔案服務（`/covers` 路由對應 `covers/` 資料夾）
- [x] 5.2 建立 `backend/api/videos.py`，實作 `GET /api/videos`（含分頁、`q`、`actor`、`tag` 過濾參數）
- [x] 5.3 實作 `GET /api/videos/{id}` 端點，回傳含演員、標籤、出版商的完整資料
- [x] 5.4 實作 `PUT /api/videos/{id}` 端點，支援手動更新 metadata，更新 `metadata_source` 為 `manual`
- [x] 5.5 建立 `backend/api/scan.py`，實作 `POST /api/scan`（非同步觸發掃描）與 `GET /api/scan/status`（回傳進度）
- [x] 5.6 實作 `POST /api/videos/{id}/fetch` 端點，對單部影片重新觸發 metadata 抓取
- [x] 5.7 建立 `backend/api/actors.py` 與 `backend/api/tags.py`，實作 `GET /api/actors` 與 `GET /api/tags`
- [x] 5.8 設定 CORS，允許前端開發伺服器（`localhost:5173`）存取

## 6. React 前端

- [x] 6.1 建立 `frontend/src/api/client.ts`，設定 Axios instance 指向後端 `http://localhost:8000`
- [x] 6.2 建立 `frontend/src/api/videos.ts`，封裝所有影片相關 API 呼叫
- [x] 6.3 實作 `VideoGrid` 元件，以網格排列顯示封面縮圖，封面不存在時顯示佔位圖
- [x] 6.4 實作搜尋欄元件，輸入時即時更新查詢參數
- [x] 6.5 實作演員與分類過濾器側欄，呼叫 `GET /api/actors` 與 `GET /api/tags`
- [x] 6.6 實作 `VideoDetail` 頁面，顯示完整 metadata（封面大圖、演員、標籤、出版商等）
- [x] 6.7 實作 `VideoDetail` 的編輯模式，點擊演員名稱可跳回主頁並自動過濾
- [x] 6.8 實作 `ScanPage` 頁面：資料夾路徑輸入、觸發掃描、進度條顯示、unmatched 清單管理
- [x] 6.9 實作分頁或無限捲動

## 7. 整合驗證

- [ ] 7.1 端對端測試：放入 3~5 個有效番號的測試影片，執行完整掃描流程，確認 metadata 正確寫入
- [ ] 7.2 測試 unmatched 影片的手動輸入番號流程
- [ ] 7.3 測試 AI fallback（使用一個爬蟲查不到的番號）
- [ ] 7.4 確認封面圖片正確下載並在前端顯示
- [ ] 7.5 確認搜尋、演員過濾、分類過濾功能正常運作
