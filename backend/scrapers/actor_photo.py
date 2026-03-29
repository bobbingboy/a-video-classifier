"""
Fetch actor (actress) photo from Javbus.
Strategy:
  1. Search Javbus for the actress name (type=2 filters to actresses)
  2. Parse the first result to get the actress page URL
  3. Fetch the actress page and extract the profile photo URL
  4. Download the photo to actor_photos/
"""
from pathlib import Path
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup

BASE_URL = "https://www.javbus.com"
ACTOR_PHOTOS_DIR = Path(__file__).parent.parent.parent / "actor_photos"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    "Referer": "https://www.javbus.com/",
}


async def fetch_actor_photo(actor_name: str) -> str | None:
    """
    Search for an actress on Javbus and download their profile photo.
    Returns the local relative path (e.g. 'actor_photos/山岸逢花.jpg') or None.
    """
    ACTOR_PHOTOS_DIR.mkdir(exist_ok=True)

    star_url = await _find_star_page(actor_name)
    if not star_url:
        return None

    photo_url = await _extract_photo_url(star_url)
    if not photo_url:
        return None

    return await _download_photo(actor_name, photo_url)


async def _find_star_page(name: str) -> str | None:
    search_url = f"{BASE_URL}/search/{quote(name)}&type=2"
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(search_url)
            if resp.status_code != 200:
                return None
            soup = BeautifulSoup(resp.text, "html.parser")
            # First actress result
            link = soup.select_one("div.item.search-item a.avatar-box")
            if link:
                href = link.get("href", "")
                return href if href.startswith("http") else BASE_URL + href
    except httpx.RequestError:
        pass
    return None


async def _extract_photo_url(star_url: str) -> str | None:
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(star_url)
            if resp.status_code != 200:
                return None
            soup = BeautifulSoup(resp.text, "html.parser")
            img = soup.select_one("div.avatar-box img") or soup.select_one("img.photo-frame")
            if not img:
                return None
            src = img.get("src", "")
            if src.startswith("//"):
                src = "https:" + src
            return src or None
    except httpx.RequestError:
        pass
    return None


async def _download_photo(name: str, url: str) -> str | None:
    # Sanitize name for use as filename
    import re
    safe_name = re.sub(r'[<>:"/\\|?*]', "_", name)
    ext = Path(url.split("?")[0]).suffix or ".jpg"
    dest = ACTOR_PHOTOS_DIR / f"{safe_name}{ext}"

    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                dest.write_bytes(resp.content)
                return f"actor_photos/{safe_name}{ext}"
    except httpx.RequestError:
        pass
    return None
