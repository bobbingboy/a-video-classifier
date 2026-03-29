from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///../videos.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
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
    import sqlalchemy as sa
    with engine.connect() as conn:
        actors_cols = {row[1] for row in conn.execute(sa.text("PRAGMA table_info(actors)"))}
        if "photo_local_path" not in actors_cols:
            conn.execute(sa.text("ALTER TABLE actors ADD COLUMN photo_local_path TEXT"))
            conn.commit()

        # scraper_sources / scraper_stats are created by create_all above;
        # nothing extra needed here yet.
