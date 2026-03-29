from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Tag, VideoTag
from backend.schemas import TagWithCount

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=list[TagWithCount])
def list_tags(db: Session = Depends(get_db)):
    rows = (
        db.query(Tag, func.count(VideoTag.video_id).label("video_count"))
        .outerjoin(VideoTag, VideoTag.tag_id == Tag.id)
        .group_by(Tag.id)
        .order_by(func.count(VideoTag.video_id).desc())
        .all()
    )
    return [
        TagWithCount(id=tag.id, name=tag.name, video_count=count)
        for tag, count in rows
    ]
