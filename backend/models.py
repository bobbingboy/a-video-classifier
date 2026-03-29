from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from backend.database import Base


class Studio(Base):
    __tablename__ = "studios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    videos = relationship("Video", back_populates="studio")


class Actor(Base):
    __tablename__ = "actors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

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
