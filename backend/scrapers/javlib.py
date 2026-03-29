import httpx
from bs4 import BeautifulSoup

_BASE_URLS = [
    "https://www.z93j.com/cn",
    "https://www.javlibrary.com/cn",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
}


async def fetch(code: str) -> dict | None:
    """
    Query JavLib for a JAV product code.
    Tries each domain in _BASE_URLS until one succeeds.
    Returns a metadata dict or None if not found.
    """
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        for base_url in _BASE_URLS:
            result = await _fetch_from(client, base_url, code)
            if result is not None:
                return result
    return None


async def _fetch_from(client: httpx.AsyncClient, base_url: str, code: str) -> dict | None:
    search_url = f"{base_url}/vl_searchbyid.php?keyword={code}"
    try:
        resp = await client.get(search_url)
        if resp.status_code in (403, 429, 503):
            return None
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")

        # If redirected directly to a detail page (single result)
        if soup.select_one("#video_title"):
            return _parse(resp.text, code, base_url)

        # Multiple results — find exact code match
        detail_path = _find_exact_result(soup, code)
        if not detail_path:
            return None

        detail_url = f"{base_url}/{detail_path.lstrip('/')}"
        detail_resp = await client.get(detail_url)
        if detail_resp.status_code != 200:
            return None

        return _parse(detail_resp.text, code, base_url)
    except httpx.RequestError:
        return None


def _find_exact_result(soup: BeautifulSoup, code: str) -> str | None:
    """Return the href of the first result whose ID matches the code exactly."""
    for item in soup.select("div.video"):
        id_tag = item.select_one("div.id")
        if id_tag and id_tag.text.strip().upper() == code.upper():
            link = item.select_one("a")
            return link.get("href") if link else None
    return None


def _parse(html: str, code: str, base_url: str) -> dict | None:
    soup = BeautifulSoup(html, "html.parser")

    title_tag = soup.select_one("#video_title a") or soup.select_one("#video_title h3")
    title = title_tag.text.strip() if title_tag else None
    if not title:
        return None

    cover_tag = soup.select_one("#video_jacket_img")
    cover_url = cover_tag.get("src") if cover_tag else None
    if cover_url and cover_url.startswith("//"):
        cover_url = "https:" + cover_url

    actors = [
        a.text.strip()
        for a in soup.select("#video_cast .cast .star a")
    ]

    tags = [
        a.text.strip()
        for a in soup.select("#video_genres .genre a")
    ]

    studio_tag = soup.select_one("#video_maker .maker a")
    studio = studio_tag.text.strip() if studio_tag else None

    date_tag = soup.select_one("#video_date .text")
    release_date = date_tag.text.strip() if date_tag else None

    return {
        "code": code,
        "title": title,
        "cover_url": cover_url,
        "studio": studio,
        "release_date": release_date,
        "actors": actors,
        "tags": tags,
        "source": "javlib",
    }
