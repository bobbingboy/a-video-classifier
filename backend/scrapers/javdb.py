import httpx
from bs4 import BeautifulSoup

BASE_URL = "https://javdb.com"
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
    Query JavDB for a JAV product code.
    Returns a metadata dict or None if not found.
    """
    # First search for the code to get the detail page URL
    search_url = f"{BASE_URL}/search?q={code}&f=all"
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(search_url)
            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.text, "html.parser")
            # Find first result matching the exact code
            result = _find_exact_result(soup, code)
            if not result:
                return None

            detail_url = BASE_URL + result
            detail_resp = await client.get(detail_url)
            if detail_resp.status_code != 200:
                return None

            return _parse(detail_resp.text, code)
    except httpx.RequestError:
        return None


def _find_exact_result(soup: BeautifulSoup, code: str) -> str | None:
    """Return the href of the first search result whose code matches exactly."""
    for item in soup.select("div.item"):
        strong = item.select_one("strong")
        if strong and strong.text.strip().upper() == code.upper():
            link = item.select_one("a")
            return link.get("href") if link else None
    return None


def _parse(html: str, code: str) -> dict | None:
    soup = BeautifulSoup(html, "html.parser")

    title_tag = soup.select_one("strong.current-title") or soup.select_one("h2.title strong")
    title = title_tag.text.strip() if title_tag else None
    if not title:
        return None

    cover_tag = soup.select_one("img.video-cover")
    cover_url = cover_tag.get("src") if cover_tag else None

    info: dict[str, str] = {}
    for panel in soup.select("div.panel-block"):
        label_tag = panel.select_one("strong")
        value_tag = panel.select_one("span.value")
        if label_tag and value_tag:
            info[label_tag.text.strip().rstrip(":")] = value_tag.text.strip()

    actors = [a.text.strip() for a in soup.select("div.panel-block a[href*='/actors/']")]
    tags = [a.text.strip() for a in soup.select("div.panel-block a[href*='/tags/']")]

    studio = info.get("片商") or info.get("Studio")
    release_date = info.get("日期") or info.get("Date")

    return {
        "code": code,
        "title": title,
        "cover_url": cover_url,
        "studio": studio,
        "release_date": release_date,
        "actors": actors,
        "tags": tags,
        "source": "javdb",
    }
