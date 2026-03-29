import asyncio
import os
from pathlib import Path

import httpx

from backend.scrapers import ai_fallback, avsox, javbus, javdb, javlib
from backend.logger import get_logger

log = get_logger("dispatcher")

COVERS_DIR = Path(__file__).parent.parent.parent / "covers"


async def fetch_metadata(code: str) -> dict | None:
    """
    Run all metadata sources in parallel.
    Primary fields (title, cover_url, studio, actors, release_date) use priority order
    (Javbus > JavDB > Avsox > JavLib > AI fallback). Tags are unioned from all sources then AI-cleaned.
    Returns None if all sources fail.
    """
    from backend.scrapers.tag_cleaner import clean_tags

    results = await asyncio.gather(
        javbus.fetch(code),
        javdb.fetch(code),
        avsox.fetch(code),
        javlib.fetch(code),
        ai_fallback.fetch(code),
        return_exceptions=True,
    )
    sources = [r if isinstance(r, dict) else None for r in results]

    # Return None only if every source failed
    if not any(sources):
        return None

    # Primary fields: take first non-null by priority
    primary_fields = ("title", "cover_url", "studio", "actors", "release_date")
    merged: dict = {"source": next(s["source"] for s in sources if s)}
    for field in primary_fields:
        for s in sources:
            if s and s.get(field):
                merged[field] = s[field]
                break

    # Tags: union all sources, then AI-clean
    seen: set[str] = set()
    all_tags: list[str] = []
    for s in sources:
        for tag in s.get("tags") or [] if s else []:
            if tag not in seen:
                seen.add(tag)
                all_tags.append(tag)

    merged["tags"] = await clean_tags(all_tags)
    return merged


async def download_cover(code: str, url: str) -> str | None:
    """
    Download cover image to covers/<code>.jpg.
    Returns the local relative path or None on failure.
    """
    if not url:
        return None

    COVERS_DIR.mkdir(exist_ok=True)
    ext = Path(url.split("?")[0]).suffix or ".jpg"
    local_path = COVERS_DIR / f"{code}{ext}"

    from urllib.parse import urlparse
    parsed = urlparse(url)
    referer = f"{parsed.scheme}://{parsed.netloc}/"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36"
        ),
        "Referer": referer,
    }

    try:
        async with httpx.AsyncClient(headers=headers, timeout=20, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                local_path.write_bytes(resp.content)
                return f"covers/{code}{ext}"
            else:
                log.warning("封面下載失敗 %s — HTTP %s (%s)", code, resp.status_code, url)
    except httpx.RequestError as e:
        log.warning("封面下載失敗 %s — 連線錯誤: %s (%s)", code, e, url)

    return None
