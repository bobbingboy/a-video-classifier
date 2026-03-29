import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Actor, Video, VideoActor
from backend.schemas import ActorPhotoResponse, ActorWithCount

router = APIRouter(prefix="/api/actors", tags=["actors"])


@router.get("", response_model=list[ActorWithCount])
def list_actors(db: Session = Depends(get_db)):
    rows = (
        db.query(Actor, func.count(VideoActor.video_id).label("video_count"))
        .outerjoin(VideoActor, VideoActor.actor_id == Actor.id)
        .group_by(Actor.id)
        .order_by(func.count(VideoActor.video_id).desc())
        .all()
    )
    return [
        ActorWithCount(
            id=actor.id,
            name=actor.name,
            video_count=count,
            photo_local_path=actor.photo_local_path,
        )
        for actor, count in rows
    ]


@router.get("/{actor_id}/photo", response_model=ActorPhotoResponse)
async def get_actor_photo(actor_id: int, db: Session = Depends(get_db)):
    actor = db.query(Actor).filter(Actor.id == actor_id).first()
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")

    if actor.photo_local_path:
        return ActorPhotoResponse(photo_url=actor.photo_local_path)

    from backend.scrapers.actor_photo import fetch_actor_photo

    local_path = await fetch_actor_photo(actor.name)
    if local_path:
        actor.photo_local_path = local_path
        db.commit()

    return ActorPhotoResponse(photo_url=local_path)


@router.post("/{actor_id}/refetch")
async def refetch_actor_videos(actor_id: int, db: Session = Depends(get_db)):
    """重新抓取該演員所有影片的 metadata 與封面。複用掃描進度狀態。"""
    from backend.api.scan import _state, _run_scan

    if _state.running:
        raise HTTPException(status_code=409, detail="Scan already in progress")

    actor = db.query(Actor).filter(Actor.id == actor_id).first()
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")

    videos = (
        db.query(Video)
        .join(VideoActor, VideoActor.video_id == Video.id)
        .filter(VideoActor.actor_id == actor_id)
        .filter(Video.status != "unmatched")
        .all()
    )

    items = [
        {"code": v.code, "file_path": v.file_path or ""}
        for v in videos
        if v.code and not v.code.startswith("UNMATCHED_")
    ]

    if not items:
        return {"status": "no_videos", "count": 0, "actor": actor.name}

    _state.running = True
    _state.processed = 0
    _state.total = len(items)
    _state.failed = 0
    _state.errors = []

    asyncio.create_task(_run_scan(items))

    return {"status": "started", "count": len(items), "actor": actor.name}
