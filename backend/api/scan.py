import asyncio
import os
from dataclasses import dataclass, field

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import SessionLocal, get_db
from backend.logger import get_logger
from backend.models import Actor, Studio, Tag, Video, VideoActor, VideoTag
from backend.scanner import scan_new_files
from backend.schemas import ScanRequest, ScanStatus
from backend.scrapers.dispatcher import download_cover, fetch_metadata

log = get_logger("scan")


def _resolve_folders(requested: list[str] | None) -> list[str]:
    """Return the list of folders to scan.
    Uses request body if provided, otherwise falls back to VIDEOS_FOLDERS env var."""
    if requested:
        return list(dict.fromkeys(f.strip() for f in requested if f.strip()))
    env = os.getenv("VIDEOS_FOLDERS") or os.getenv("VIDEOS_FOLDER", "")
    folders = list(dict.fromkeys(f.strip() for f in env.split(",") if f.strip()))
    if not folders:
        raise HTTPException(
            status_code=400,
            detail="No folder paths provided and VIDEOS_FOLDERS env var is not set.",
        )
    return folders

router = APIRouter(prefix="/api", tags=["scan"])


@dataclass
class _ScanState:
    running: bool = False
    processed: int = 0
    total: int = 0
    failed: int = 0
    errors: list[str] = field(default_factory=list)


_state = _ScanState()


@router.get("/scan/status", response_model=ScanStatus)
def get_scan_status():
    return ScanStatus(
        running=_state.running,
        processed=_state.processed,
        total=_state.total,
        failed=_state.failed,
        errors=_state.errors[-20:],
    )


@router.post("/scan")
async def trigger_scan(req: ScanRequest, db: Session = Depends(get_db)):
    if _state.running:
        raise HTTPException(status_code=409, detail="Scan already in progress")

    folders = _resolve_folders(req.folder_paths)

    all_matched: list[dict] = []
    all_unmatched: list[dict] = []
    errors: list[str] = []

    for folder in folders:
        try:
            matched, unmatched = scan_new_files(folder, db)
            all_matched.extend(matched)
            all_unmatched.extend(unmatched)
        except FileNotFoundError as e:
            errors.append(str(e))

    if errors and not all_matched and not all_unmatched:
        raise HTTPException(status_code=400, detail="; ".join(errors))

    # Write unmatched entries immediately (deduplicate by file_path)
    seen_paths: set[str] = set()
    for item in all_unmatched:
        if item["file_path"] in seen_paths:
            continue
        seen_paths.add(item["file_path"])
        existing = db.query(Video).filter(Video.file_path == item["file_path"]).first()
        if not existing:
            filename = os.path.basename(item["file_path"])
            unmatched_code = f"UNMATCHED_{filename}"
            db.add(Video(file_path=item["file_path"], code=unmatched_code, status="unmatched"))
    db.commit()

    if not all_matched:
        return {"status": "done", "matched": 0, "unmatched": len(all_unmatched), "errors": errors}

    _state.running = True
    _state.processed = 0
    _state.total = len(all_matched)
    _state.failed = 0
    _state.errors = errors[:]  # pre-populate folder errors if any

    asyncio.create_task(_run_scan(all_matched))

    return {"status": "started", "matched": len(all_matched), "unmatched": len(all_unmatched), "errors": errors}


async def _run_scan(items: list[dict]):
    for item in items:
        db: Session = SessionLocal()
        try:
            await _process_one(item["code"], item["file_path"], db)
            _state.processed += 1
        except Exception as e:
            _state.failed += 1
            _state.errors.append(f"{item['code']}: {e}")
            _state.processed += 1
            log.error("掃描失敗 %s: %s", item["code"], e, exc_info=True)
        finally:
            db.close()

    _state.running = False


async def _process_one(code: str, file_path: str, db: Session):
    existing = db.query(Video).filter(Video.code == code).first()

    meta = await fetch_metadata(code)
    status = "ok" if meta else "needs_manual_review"

    if existing:
        video = existing
    else:
        video = Video(code=code, file_path=file_path, status=status)
        db.add(video)
        db.flush()

    if not meta:
        video.status = "needs_manual_review"
        db.commit()
        return

    video.title = meta.get("title")
    video.cover_url = meta.get("cover_url")
    video.release_date = meta.get("release_date")
    video.metadata_source = meta.get("source")
    video.status = "ok"
    video.file_path = file_path

    if meta.get("studio"):
        studio = db.query(Studio).filter(Studio.name == meta["studio"]).first()
        if not studio:
            studio = Studio(name=meta["studio"])
            db.add(studio)
            db.flush()
        video.studio_id = studio.id

    db.query(VideoActor).filter(VideoActor.video_id == video.id).delete()
    for name in dict.fromkeys(meta.get("actors", [])):
        actor = db.query(Actor).filter(Actor.name == name).first()
        if not actor:
            actor = Actor(name=name)
            db.add(actor)
            db.flush()
        db.add(VideoActor(video_id=video.id, actor_id=actor.id))

    db.query(VideoTag).filter(VideoTag.video_id == video.id).delete()
    for name in dict.fromkeys(meta.get("tags", [])):
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
        db.add(VideoTag(video_id=video.id, tag_id=tag.id))

    db.commit()

    if meta.get("cover_url"):
        local_path = await download_cover(code, meta["cover_url"])
        if local_path:
            db.query(Video).filter(Video.id == video.id).update({"cover_local_path": local_path})
            db.commit()


@router.post("/videos/{video_id}/fetch")
async def refetch_video(video_id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if not video.code or video.code == "UNMATCHED":
        raise HTTPException(status_code=400, detail="Video has no valid code to fetch")

    await _process_one(video.code, video.file_path or "", db)
    db.refresh(video)
    return {"status": "ok", "code": video.code}
