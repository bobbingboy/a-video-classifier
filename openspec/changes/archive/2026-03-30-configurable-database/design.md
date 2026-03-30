## Architecture

### 配置方式

透過 `.env` 的 `DATABASE_URL` 環境變數決定資料庫引擎：

```
# SQLite（預設，零配置）
DATABASE_URL=sqlite:///../videos.db

# PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/dbname

# MySQL
DATABASE_URL=mysql+pymysql://user:password@host:3306/dbname
```

### 引擎偵測與差異處理

```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///../videos.db")
is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
)
```

### Migration 跨引擎相容

用 SQLAlchemy `inspect()` 取代 `PRAGMA`：

```python
from sqlalchemy import inspect

def _run_migrations():
    inspector = inspect(engine)
    columns = {c["name"] for c in inspector.get_columns("actors")}
    if "photo_local_path" not in columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE actors ADD COLUMN photo_local_path TEXT"))
            conn.commit()
```

## Key Decisions

### 1. 預設值保持 SQLite

不傳 `DATABASE_URL` 時自動使用 SQLite，確保零配置即可本地開發。

### 2. Driver 不列為必要依賴

`psycopg2-binary` 和 `pymysql` 只在使用對應 DB 時才需要安裝，不寫進 `requirements.txt` 的主列表，以註解說明。

### 3. 不做自動資料遷移

SQLite → PostgreSQL 的資料搬移交由使用者手動處理（如 `pgloader` 或自寫腳本），因為這是一次性操作。
