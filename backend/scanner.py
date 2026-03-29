import re
from pathlib import Path

from sqlalchemy.orm import Session

from backend.models import Actor, Video

VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".wmv", ".mov"}

# Matches common JAV code patterns:
# Standard:    SSIS-123, ABC-1234
# No dash:     SSIS123, ABC1234
# FC2/Carib:   FC2-PPV-1234567, CARIB-123456-789
_CODE_PATTERNS = [
    # Bracketed: [SSIS-123] or (SSIS-123)
    r"[\[\(]([A-Za-z0-9]+-[A-Za-z0-9]+-?[0-9]*)\]?\)?",
    # Standard with dash: SSIS-123
    r"\b([A-Za-z]{2,10}-[A-Za-z0-9]+-[0-9]{3,7})\b",
    r"\b([A-Za-z]{2,10}-[0-9]{3,7})\b",
    # No dash: SSIS123 (letters then digits)
    r"\b([A-Za-z]{2,10})([0-9]{3,7})\b",
]


def scan_folder(folder_path: str) -> list[Path]:
    """Return all video files found recursively under folder_path."""
    root = Path(folder_path)
    if not root.exists():
        raise FileNotFoundError(f"Folder not found: {folder_path}")
    return [p for p in root.rglob("*") if p.suffix.lower() in VIDEO_EXTENSIONS]


def parse_code(filename: str) -> str | None:
    """Extract and normalize a JAV product code from a filename."""
    stem = Path(filename).stem

    # Try bracketed pattern first
    m = re.search(r"[\[\(]([A-Za-z0-9]+-[A-Za-z0-9]+-?[0-9]*)\]?\)?", stem)
    if m:
        return m.group(1).upper()

    # Three-part codes like FC2-PPV-1234567
    m = re.search(r"\b([A-Za-z]{2,6}-[A-Za-z]{2,6}-[0-9]{4,10})\b", stem, re.IGNORECASE)
    if m:
        return m.group(1).upper()

    # Standard two-part codes with dash: SSIS-123
    m = re.search(r"\b([A-Za-z]{2,10})-([0-9]{3,7})\b", stem, re.IGNORECASE)
    if m:
        return f"{m.group(1).upper()}-{m.group(2)}"

    # No-dash format: SSIS123
    m = re.search(r"\b([A-Za-z]{2,10})([0-9]{3,7})\b", stem, re.IGNORECASE)
    if m:
        return f"{m.group(1).upper()}-{m.group(2)}"

    return None


def infer_actor_from_path(file_path: str, db: Session) -> Actor | None:
    """Walk up the directory tree from file_path and return the first Actor
    whose name matches a folder name. Returns None if no match is found."""
    path = Path(file_path)
    for parent in path.parents:
        actor = db.query(Actor).filter(Actor.name == parent.name).first()
        if actor:
            return actor
    return None


def get_existing_paths(db: Session) -> set[str]:
    """Return the set of file_path values already in the database."""
    rows = db.query(Video.file_path).filter(Video.file_path.isnot(None)).all()
    return {r.file_path for r in rows}


def scan_new_files(folder_path: str, db: Session, force: bool = False) -> tuple[list[dict], list[dict]]:
    """
    Scan folder_path for video files.

    Args:
        force: 若 True，已在 DB 中的影片也會重新處理；否則只處理新檔案。

    Returns:
        matched   — list of {file_path, code} dicts ready for metadata fetch
        unmatched — list of {file_path} dicts where code could not be parsed
    """
    all_files = scan_folder(folder_path)
    existing = get_existing_paths(db) if not force else set()

    matched: list[dict] = []
    unmatched: list[dict] = []

    for path in all_files:
        abs_path = str(path.resolve())
        if abs_path in existing:
            continue

        code = parse_code(path.name)
        if code:
            matched.append({"file_path": abs_path, "code": code})
        else:
            unmatched.append({"file_path": abs_path})

    return matched, unmatched
