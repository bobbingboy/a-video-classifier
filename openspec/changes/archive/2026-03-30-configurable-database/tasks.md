## Tasks

### Phase 1: 核心改動

- [x] 1.1 `backend/database.py` — 從 `.env` 讀取 `DATABASE_URL`，預設 SQLite；根據引擎類型設定 `connect_args`
- [x] 1.2 `backend/database.py` — `_run_migrations()` 改用 `sqlalchemy.inspect()` 取代 `PRAGMA table_info`
- [x] 1.3 `.env.example` — 新增 `DATABASE_URL` 範例（SQLite / PostgreSQL / MySQL）
- [x] 1.4 `backend/requirements.txt` — 以註解說明可選 driver（`psycopg2-binary`, `pymysql`）

### Phase 2: 文件與驗證

- [x] 2.1 `README.md` — 新增資料庫配置章節，說明不同 DB 的設定方式與 driver 安裝
- [x] 2.2 驗證 SQLite 模式仍正常運作（預設行為不變）
