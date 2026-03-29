from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ActorOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class ActorWithCount(BaseModel):
    id: int
    name: str
    video_count: int

    model_config = {"from_attributes": True}


class TagOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class TagWithCount(BaseModel):
    id: int
    name: str
    video_count: int

    model_config = {"from_attributes": True}


class StudioOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class VideoSummary(BaseModel):
    id: int
    code: str
    title: Optional[str]
    cover_local_path: Optional[str]
    status: str
    metadata_source: Optional[str]

    model_config = {"from_attributes": True}


class VideoDetail(BaseModel):
    id: int
    code: str
    title: Optional[str]
    file_path: Optional[str]
    cover_url: Optional[str]
    cover_local_path: Optional[str]
    release_date: Optional[str]
    duration: Optional[str]
    metadata_source: Optional[str]
    status: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    studio: Optional[StudioOut]
    actors: list[ActorOut] = []
    tags: list[TagOut] = []

    model_config = {"from_attributes": True}


class VideoListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[VideoSummary]


class VideoUpdate(BaseModel):
    title: Optional[str] = None
    release_date: Optional[str] = None
    duration: Optional[str] = None
    studio_name: Optional[str] = None
    actor_names: Optional[list[str]] = None
    tag_names: Optional[list[str]] = None
    cover_url: Optional[str] = None


class ScanRequest(BaseModel):
    # 若不傳，則從環境變數 VIDEOS_FOLDERS 讀取（逗號分隔）
    folder_paths: list[str] | None = None


class ScanStatus(BaseModel):
    running: bool
    processed: int
    total: int
    failed: int
    errors: list[str] = []
