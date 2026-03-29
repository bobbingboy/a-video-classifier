import os
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["browse"])


class BrowseEntry(BaseModel):
    name: str
    path: str
    is_dir: bool


class BrowseResponse(BaseModel):
    path: str
    parent: str | None
    children: list[BrowseEntry]


@router.get("/browse", response_model=BrowseResponse)
def browse(path: str = ""):
    # 若未提供路徑，回傳所有磁碟機根目錄（Windows）或 / (Unix)
    if not path:
        if os.name == "nt":
            import string
            drives = [
                BrowseEntry(name=f"{d}:\\", path=f"{d}:\\", is_dir=True)
                for d in string.ascii_uppercase
                if Path(f"{d}:\\").exists()
            ]
            return BrowseResponse(path="", parent=None, children=drives)
        else:
            path = "/"

    p = Path(path)
    if not p.exists() or not p.is_dir():
        return BrowseResponse(path=str(p), parent=str(p.parent) if p.parent != p else None, children=[])

    children: list[BrowseEntry] = []
    try:
        for entry in sorted(p.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
            if entry.is_dir() and not entry.name.startswith("."):
                children.append(BrowseEntry(name=entry.name, path=str(entry), is_dir=True))
    except PermissionError:
        pass

    parent = str(p.parent) if p.parent != p else None
    return BrowseResponse(path=str(p), parent=parent, children=children)
