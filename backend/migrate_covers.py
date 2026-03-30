"""
Migration tool: move local cover images and actor photos into the database.

Usage:
    python -m backend.migrate_covers [--clean]

    --clean  Remove local files after successful migration
"""
import mimetypes
import sys
from pathlib import Path

from backend.database import SessionLocal, init_db
from backend.models import Actor, ActorImage, Video, VideoImage


def _guess_content_type(path: Path) -> str:
    ct, _ = mimetypes.guess_type(str(path))
    return ct or "image/jpeg"


def migrate_covers(db, clean: bool = False) -> dict:
    stats = {"success": 0, "failed": 0, "skipped": 0, "failures": []}

    videos = db.query(Video).filter(Video.cover_local_path.isnot(None), Video.cover_local_path != "").all()
    total = len(videos)
    print(f"\nScanning covers... found {total} videos with cover_local_path")

    for i, video in enumerate(videos, 1):
        # Skip if already in DB
        existing = db.query(VideoImage).filter(VideoImage.video_id == video.id).first()
        if existing:
            stats["skipped"] += 1
            continue

        file_path = Path(video.cover_local_path)
        if not file_path.is_absolute():
            file_path = Path(__file__).parent.parent / file_path

        if not file_path.exists():
            stats["failed"] += 1
            stats["failures"].append(f"{video.cover_local_path} (file not found, video={video.code})")
            continue

        try:
            image_data = file_path.read_bytes()
            content_type = _guess_content_type(file_path)
            db.add(VideoImage(video_id=video.id, image_data=image_data, content_type=content_type))
            db.commit()
            stats["success"] += 1

            if clean:
                file_path.unlink(missing_ok=True)
        except Exception as e:
            db.rollback()
            stats["failed"] += 1
            stats["failures"].append(f"{video.cover_local_path} ({e})")

        if i % 50 == 0 or i == total:
            print(f"  Covers: {i}/{total} (success={stats['success']}, skip={stats['skipped']}, fail={stats['failed']})")

    return stats


def migrate_actor_photos(db, clean: bool = False) -> dict:
    stats = {"success": 0, "failed": 0, "skipped": 0, "failures": []}

    actors = db.query(Actor).filter(Actor.photo_local_path.isnot(None), Actor.photo_local_path != "").all()
    total = len(actors)
    print(f"\nScanning actor photos... found {total} actors with photo_local_path")

    for i, actor in enumerate(actors, 1):
        existing = db.query(ActorImage).filter(ActorImage.actor_id == actor.id).first()
        if existing:
            stats["skipped"] += 1
            continue

        file_path = Path(actor.photo_local_path)
        if not file_path.is_absolute():
            file_path = Path(__file__).parent.parent / file_path

        if not file_path.exists():
            stats["failed"] += 1
            stats["failures"].append(f"{actor.photo_local_path} (file not found, actor={actor.name})")
            continue

        try:
            image_data = file_path.read_bytes()
            content_type = _guess_content_type(file_path)
            db.add(ActorImage(actor_id=actor.id, image_data=image_data, content_type=content_type))
            db.commit()
            stats["success"] += 1

            if clean:
                file_path.unlink(missing_ok=True)
        except Exception as e:
            db.rollback()
            stats["failed"] += 1
            stats["failures"].append(f"{actor.photo_local_path} ({e})")

        if i % 50 == 0 or i == total:
            print(f"  Photos: {i}/{total} (success={stats['success']}, skip={stats['skipped']}, fail={stats['failed']})")

    return stats


def main():
    clean = "--clean" in sys.argv

    init_db()
    db = SessionLocal()

    try:
        cover_stats = migrate_covers(db, clean=clean)
        photo_stats = migrate_actor_photos(db, clean=clean)

        print("\n=== Migration Complete ===")
        print(f"Covers:  {cover_stats['success']} migrated, {cover_stats['skipped']} skipped, {cover_stats['failed']} failed")
        print(f"Photos:  {photo_stats['success']} migrated, {photo_stats['skipped']} skipped, {photo_stats['failed']} failed")

        all_failures = cover_stats["failures"] + photo_stats["failures"]
        if all_failures:
            print(f"\nFailed items ({len(all_failures)}):")
            for f in all_failures:
                print(f"  - {f}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
