import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Actor, Studio, Tag, Video, VideoActor, VideoTag
from backend.schemas import SetTitleRequest, VideoDetail, VideoListResponse, VideoSummary, VideoUpdate

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.get("", response_model=VideoListResponse)
def list_videos(
    page: int = 1,
    page_size: int = 24,
    q: str | None = None,
    actor: str | None = None,
    tag: str | None = None,
    status: str | None = None,
    no_cover: bool = False,
    exclude_unmatched: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Video)

    if status:
        query = query.filter(Video.status == status)

    if no_cover:
        query = query.filter(~Video.has_cover)

    if exclude_unmatched:
        query = query.filter(Video.status != "unmatched")

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Video.code.ilike(like),
                Video.title.ilike(like),
                Video.actors.any(VideoActor.actor.has(Actor.name.ilike(like))),
            )
        )

    if actor:
        query = query.filter(
            Video.actors.any(VideoActor.actor.has(Actor.name.ilike(f"%{actor}%")))
        )

    if tag:
        query = query.filter(
            Video.tags.any(VideoTag.tag.has(Tag.name.ilike(f"%{tag}%")))
        )

    total = query.count()
    items = (
        query
        .options(joinedload(Video.tags).joinedload(VideoTag.tag))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return VideoListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[VideoSummary.model_validate({
            "id": v.id,
            "code": v.code,
            "title": v.title,
            "cover_local_path": v.cover_local_path,
            "status": v.status,
            "metadata_source": v.metadata_source,
            "tags": [vt.tag for vt in v.tags if vt.tag],
        }) for v in items],
    )


@router.get("/{video_id}", response_model=VideoDetail)
def get_video(video_id: int, db: Session = Depends(get_db)):
    video = (
        db.query(Video)
        .options(
            joinedload(Video.studio),
            joinedload(Video.actors).joinedload(VideoActor.actor),
            joinedload(Video.tags).joinedload(VideoTag.tag),
        )
        .filter(Video.id == video_id)
        .first()
    )
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return VideoDetail.model_validate({
        "id": video.id,
        "code": video.code,
        "title": video.title,
        "file_path": video.file_path,
        "cover_url": video.cover_url,
        "cover_local_path": video.cover_local_path,
        "release_date": video.release_date,
        "duration": video.duration,
        "metadata_source": video.metadata_source,
        "status": video.status,
        "created_at": video.created_at,
        "updated_at": video.updated_at,
        "studio": video.studio,
        "actors": [va.actor for va in video.actors if va.actor],
        "tags": [vt.tag for vt in video.tags if vt.tag],
    })


@router.put("/{video_id}", response_model=VideoDetail)
def update_video(video_id: int, data: VideoUpdate, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if data.title is not None:
        video.title = data.title
    if data.release_date is not None:
        video.release_date = data.release_date
    if data.duration is not None:
        video.duration = data.duration
    if data.cover_url is not None:
        video.cover_url = data.cover_url

    if data.studio_name is not None:
        studio = db.query(Studio).filter(Studio.name == data.studio_name).first()
        if not studio:
            studio = Studio(name=data.studio_name)
            db.add(studio)
            db.flush()
        video.studio_id = studio.id

    if data.actor_names is not None:
        db.query(VideoActor).filter(VideoActor.video_id == video_id).delete()
        for name in data.actor_names:
            actor = db.query(Actor).filter(Actor.name == name).first()
            if not actor:
                actor = Actor(name=name)
                db.add(actor)
                db.flush()
            db.add(VideoActor(video_id=video_id, actor_id=actor.id))

    if data.tag_names is not None:
        db.query(VideoTag).filter(VideoTag.video_id == video_id).delete()
        for name in data.tag_names:
            tag = db.query(Tag).filter(Tag.name == name).first()
            if not tag:
                tag = Tag(name=name)
                db.add(tag)
                db.flush()
            db.add(VideoTag(video_id=video_id, tag_id=tag.id))

    video.metadata_source = "manual"
    db.commit()
    db.refresh(video)
    return get_video(video_id, db)


@router.get("/{video_id}/stream")
def stream_video(video_id: int, request: Request, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    file_path = video.file_path
    if not file_path:
        raise HTTPException(status_code=404, detail="No file path recorded")

    if not file_path.lower().endswith(".mp4"):
        raise HTTPException(status_code=415, detail="Only .mp4 files are supported for streaming")

    path = Path(file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    file_size = path.stat().st_size
    chunk_size = 1024 * 1024  # 1 MB

    range_header = request.headers.get("Range")
    if range_header:
        match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if match:
            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else file_size - 1
            end = min(end, file_size - 1)
            content_length = end - start + 1

            def iter_range():
                with open(path, "rb") as f:
                    f.seek(start)
                    remaining = content_length
                    while remaining > 0:
                        data = f.read(min(chunk_size, remaining))
                        if not data:
                            break
                        remaining -= len(data)
                        yield data

            return StreamingResponse(
                iter_range(),
                status_code=206,
                media_type="video/mp4",
                headers={
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(content_length),
                },
            )

    def iter_full():
        with open(path, "rb") as f:
            while True:
                data = f.read(chunk_size)
                if not data:
                    break
                yield data

    return StreamingResponse(
        iter_full(),
        media_type="video/mp4",
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
        },
    )


@router.post("/{video_id}/set-title")
def set_video_title(video_id: int, data: SetTitleRequest, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    video.title = data.title
    video.metadata_source = "manual"
    if video.status == "unmatched":
        video.status = "needs_manual_review"
    db.commit()
    return {"status": "ok"}
