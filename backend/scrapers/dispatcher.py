import asyncio
import os
from pathlib import Path

import httpx

from backend.scrapers import ai_fallback, javbus, javdb

COVERS_DIR = Path(__file__).parent.parent.parent / "covers"


async def fetch_metadata(code: str) -> dict | None:
    """
    Try metadata sources in order: Javbus → JavDB → AI fallback.
    Returns metadata dict with 'source' field, or None if all fail.
    """
    result = await javbus.fetch(code)
    if result:
        return result

    result = await javdb.fetch(code)
    if result:
        return result

    result = await ai_fallback.fetch(code)
    return result


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

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36"
        )
    }

    try:
        async with httpx.AsyncClient(headers=headers, timeout=20, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                local_path.write_bytes(resp.content)
                # Return path relative to project root for serving
                return f"covers/{code}{ext}"
    except httpx.RequestError:
        pass

    return None
