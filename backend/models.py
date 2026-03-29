from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, and_
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

from backend.database import Base


class ScraperSource(Base):
    __tablename__ = "scraper_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    enabled = Column(Boolean, nullable=False, default=True)
    priority = Column(Integer, nullable=False, default=0)
    parse_mode = Column(String, nullable=False)      # "builtin" | "selectors"
    builtin_key = Column(String, nullable=True)       # e.g. "javbus", "javdb"
    base_urls = Column(JSON, nullable=False, default=list)
    access_mode = Column(String, nullable=False, default="direct")  # "direct" | "search"
    search_url_pattern = Column(String, nullable=True)
    result_link_selector = Column(String, nullable=True)
    result_code_selector = Column(String, nullable=True)
    selectors = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    stats = relationship("ScraperStats", back_populates="source", uselist=False, cascade="all, delete-orphan")


class ScraperStats(Base):
    __tablename__ = "scraper_stats"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("scraper_sources.id", ondelete="CASCADE"), nullable=False, unique=True)
    attempts = Column(Integer, nullable=False, default=0)
    successes = Column(Integer, nullable=False, default=0)
    consecutive_failures = Column(Integer, nullable=False, default=0)
    cooldown_until = Column(DateTime, nullable=True)
    last_attempt = Column(DateTime, nullable=True)

    source = relationship("ScraperSource", back_populates="stats")


class Studio(Base):
    __tablename__ = "studios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    videos = relationship("Video", back_populates="studio")


class Actor(Base):
    __tablename__ = "actors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    photo_local_path = Column(String, nullable=True)

    videos = relationship("VideoActor", back_populates="actor")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    videos = relationship("VideoTag", back_populates="tag")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    cover_local_path = Column(String, nullable=True)
    studio_id = Column(Integer, ForeignKey("studios.id"), nullable=True)
    release_date = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    # javbus | javdb | ai | manual
    metadata_source = Column(String, nullable=True)
    # ok | unmatched | needs_manual_review | file_missing
    status = Column(String, nullable=False, default="ok")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    studio = relationship("Studio", back_populates="videos")
    actors = relationship("VideoActor", back_populates="video", cascade="all, delete-orphan")
    tags = relationship("VideoTag", back_populates="video", cascade="all, delete-orphan")

    @hybrid_property
    def has_cover(self) -> bool:
        """影片是否已有本地封面圖片。"""
        return bool(self.cover_local_path)

    @has_cover.expression  # type: ignore[no-redef]
    def has_cover(cls):
        return and_(cls.cover_local_path.isnot(None), cls.cover_local_path != "")


class VideoActor(Base):
    __tablename__ = "video_actors"
    __table_args__ = (UniqueConstraint("video_id", "actor_id"),)

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("actors.id"), nullable=False)

    video = relationship("Video", back_populates="actors")
    actor = relationship("Actor", back_populates="videos")


class VideoTag(Base):
    __tablename__ = "video_tags"
    __table_args__ = (UniqueConstraint("video_id", "tag_id"),)

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False)

    video = relationship("Video", back_populates="tags")
    tag = relationship("Tag", back_populates="videos")
