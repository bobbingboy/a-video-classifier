from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Actor, VideoActor
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
