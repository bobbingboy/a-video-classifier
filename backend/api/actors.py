from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Actor, VideoActor
from backend.schemas import ActorWithCount

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
        ActorWithCount(id=actor.id, name=actor.name, video_count=count)
        for actor, count in rows
    ]
