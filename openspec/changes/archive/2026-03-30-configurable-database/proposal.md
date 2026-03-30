## Why

目前 `database.py` 硬編碼 SQLite 路徑，無法在不同環境（個人電腦、工作筆電、AWS）共享同一個資料庫。需要讓 DB 連線可透過環境變數配置，支援多種資料庫引擎。

## What Changes

- `backend/database.py` — 從 `.env` 讀取 `DATABASE_URL`，根據引擎類型自動設定 `connect_args`
- `backend/database.py` — `_run_migrations()` 改用 SQLAlchemy `inspect()` API 取代 SQLite 專用的 `PRAGMA`
- `.env.example` — 新增 `DATABASE_URL` 範例（SQLite / PostgreSQL / MySQL）
- `backend/requirements.txt` — 註解說明可選的 driver（`psycopg2-binary`, `pymysql`）

## Capabilities

### Modified Capabilities

- `database`: 資料庫連線改為可配置，支援 SQLite、PostgreSQL、MySQL

## Impact

- `backend/database.py`: 主要改動
- `.env.example`: 新增設定說明
- `backend/requirements.txt`: 新增可選 driver 註解
- `README.md`: 新增不同 DB 的配置說明

## Non-goals

- 不做資料遷移工具（SQLite → PostgreSQL 的資料搬移）
- 不改變 ORM models 或 API 邏輯
- 不處理封面圖片儲存方式（另一個 change）
