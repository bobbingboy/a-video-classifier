import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

def _build_database_url() -> str:
    host = os.getenv("DB_HOST")
    if host:
        user = os.getenv("DB_USER", "postgres")
        password = os.getenv("DB_PASSWORD", "")
        port = os.getenv("DB_PORT", "5432")
        name = os.getenv("DB_NAME", "postgres")
        return f"postgresql://{user}:{password}@{host}:{port}/{name}"
    return os.getenv("DATABASE_URL", "sqlite:///../videos.db")

DATABASE_URL = _build_database_url()

_is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from backend import models  # noqa: F401 — ensures models are registered
    Base.metadata.create_all(bind=engine)
    _run_migrations()


def _run_migrations():
    """Apply any schema additions that create_all won't handle on existing tables."""
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    actors_cols = {c["name"] for c in inspector.get_columns("actors")}
    if "photo_local_path" not in actors_cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE actors ADD COLUMN photo_local_path TEXT"))
            conn.commit()
