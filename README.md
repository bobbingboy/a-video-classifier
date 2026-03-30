# Video Classifier

影片庫管理系統 — 自動掃描本機影片檔案，從多個線上來源擷取 metadata，提供瀏覽、搜尋、篩選與手動編輯功能。

## 功能特色

- **自動掃描** — 遞迴掃描指定資料夾，從檔名解析番號（支援 `SSIS-123`、`FC2-PPV-1234567` 等格式）
- **多來源爬取** — 平行查詢 JavBus、JavDB、Avsox、JavLib，依成功率加權合併結果
- **AI 備援** — 爬蟲皆失敗時，透過 OpenRouter Perplexity API 取得 metadata
- **失敗偵測** — 連續失敗 5 次後自動冷卻 30 分鐘，避免無效請求
- **自訂爬蟲** — 透過 CSS selector 定義新來源，無需修改程式碼
- **影片播放** — 內建播放器，音量設定持久化至 localStorage
- **手動校正** — 編輯標題、演員、標籤、片商、時長、發行日期
- **批次操作** — 批量抓取缺少的封面圖片
- **篩選系統** — 依演員、標籤、狀態（未辨識、無封面）篩選

## 技術架構

### Backend

- **FastAPI** + **Uvicorn** — REST API 伺服器
- **SQLAlchemy** + **SQLite** — ORM 與資料庫
- **httpx** + **BeautifulSoup4** — 非同步 HTTP 與 HTML 解析
- **OpenAI SDK** — 串接 OpenRouter AI 備援

### Frontend

- **React 19** + **TypeScript** — UI 框架
- **Vite** — 建置工具
- **Material-UI (MUI)** — 元件庫（Dark Theme）
- **React Router** — 客戶端路由
- **Axios** — HTTP 請求

### 專案結構

```
backend/
├── main.py              # FastAPI 入口，掛載靜態檔與路由
├── models.py            # SQLAlchemy ORM 模型
├── database.py          # 資料庫連線與 session 管理
├── scanner.py           # 檔案掃描與番號解析
├── schemas.py           # Pydantic schema
├── api/                 # API 路由
│   ├── videos.py        # 影片 CRUD、搜尋、篩選
│   ├── scan.py          # 掃描觸發與進度查詢
│   ├── actors.py        # 演員列表與照片
│   ├── tags.py          # 標籤列表
│   ├── scrapers.py      # 爬蟲來源管理與測試
│   └── browse.py        # 檔案系統瀏覽
└── scrapers/            # 爬蟲引擎
    ├── dispatcher.py    # 平行派發與結果合併
    ├── selector_engine.py # CSS selector 自訂爬蟲
    ├── ai_fallback.py   # AI 備援查詢
    └── tag_cleaner.py   # 標籤正規化

frontend/src/
├── api/                 # API 客戶端層
├── components/          # 共用元件（FilterSidebar、SearchBar、VideoGrid）
├── pages/               # 頁面（VideoDetail、ScanPage）
├── App.tsx              # 主佈局與影片庫頁面
├── theme.ts             # MUI 深色主題設定
└── main.tsx             # React 進入點
```

## 快速開始

### 環境需求

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

預設啟動於 `http://localhost:8000`。

### 環境變數設定

專案根目錄提供了 `.env.example` 範例檔，複製一份並重新命名為 `.env`：

```bash
cp .env.example .env
```

然後編輯 `.env`，填入對應的值：

| 變數名稱 | 說明 |
|----------|------|
| `OPENROUTER_API_KEY` | OpenRouter API 金鑰，用於爬蟲皆失敗時的 AI 備援查詢。不設定則跳過 AI 備援 |
| `VIDEOS_FOLDERS` | 影片資料夾路徑，多個路徑以逗號分隔。系統會遞迴掃描每個路徑下的所有子資料夾 |
| `DATABASE_URL` | 資料庫連線字串（見下方說明）。不設定則預設使用 SQLite |

### 資料庫配置

預設使用 SQLite，無需額外設定。如需使用其他資料庫，在 `.env` 中設定 `DATABASE_URL`：

| 資料庫 | DATABASE_URL 格式 | 需安裝 Driver |
|--------|-------------------|---------------|
| SQLite（預設） | `sqlite:///../videos.db` | 不需要 |
| PostgreSQL | `postgresql://user:password@host:5432/dbname` | `pip install psycopg2-binary` |
| MySQL | `mysql+pymysql://user:password@host:3306/dbname` | `pip install pymysql` |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

預設啟動於 `http://localhost:5173`。

## API 概覽

| 路由 | 說明 |
|------|------|
| `GET /api/videos` | 影片列表（分頁、篩選、搜尋） |
| `GET /api/videos/:id` | 影片詳情 |
| `PUT /api/videos/:id` | 更新影片 metadata |
| `POST /api/scan` | 觸發資料夾掃描 |
| `GET /api/scan/status` | 掃描進度 |
| `GET /api/actors` | 演員列表（含影片數） |
| `GET /api/tags` | 標籤列表（含影片數） |
| `GET /api/scrapers` | 爬蟲來源管理 |
| `GET /api/browse` | 檔案系統瀏覽 |
