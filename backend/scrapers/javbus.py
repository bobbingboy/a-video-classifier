import httpx
from bs4 import BeautifulSoup

BASE_URL = "https://www.javbus.com"
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
    Query Javbus for a JAV product code.
    Returns a metadata dict or None if not found.
    """
    url = f"{BASE_URL}/{code}"
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            return _parse(resp.text, code)
    except httpx.RequestError:
        return None


def _parse(html: str, code: str) -> dict | None:
    soup = BeautifulSoup(html, "html.parser")

    # Bail out early if Javbus shows a "not found" page
    if soup.find("title") and "404" in (soup.find("title").text or ""):
        return None

    title_tag = soup.select_one("div.container h3")
    title = title_tag.text.strip() if title_tag else None
    if not title:
        return None

    cover_tag = soup.select_one("a.bigImage img") or soup.select_one("div#video_jacket img")
    cover_url = cover_tag.get("src") if cover_tag else None
    if cover_url and cover_url.startswith("//"):
        cover_url = "https:" + cover_url

    info = {}
    for p in soup.select("div.col-md-3.info p"):
        label_tag = p.find("span", class_="header")
        if not label_tag:
            continue
        label = label_tag.text.strip().rstrip(":")
        value_tag = p.find("a") or p.find("span", class_=False)
        value = value_tag.text.strip() if value_tag else p.text.replace(label, "").strip().strip(":")

        info[label] = value

    # Actors
    actors = [a.text.strip() for a in soup.select("div#avatar-waterfall a.avatar-box span")]

    # Tags/genres
    tags = [a.text.strip() for a in soup.select("span.genre a")]

    studio = info.get("製作商") or info.get("Studio") or info.get("廠商")
    release_date = info.get("發行日期") or info.get("Date") or info.get("發售日")

    return {
        "code": code,
        "title": title,
        "cover_url": cover_url,
        "studio": studio,
        "release_date": release_date,
        "actors": actors,
        "tags": tags,
        "source": "javbus",
    }
