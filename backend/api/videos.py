from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Actor, Studio, Tag, Video, VideoActor, VideoTag
from backend.schemas import VideoDetail, VideoListResponse, VideoSummary, VideoUpdate

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.get("", response_model=VideoListResponse)
def list_videos(
    page: int = 1,
    page_size: int = 24,
    q: str | None = None,
    actor: str | None = None,
    tag: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Video)

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
