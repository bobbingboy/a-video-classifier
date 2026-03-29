import httpx
from bs4 import BeautifulSoup

# 備用域名列表，依序嘗試，遇到 403/連線失敗時切換
# seedmm.bond 為目前較新的鏡像；javbus.com 為官方但常被牆
_BASE_URLS = [
    "https://www.seedmm.bond",
    "https://www.javsee.bond",
    "https://www.dmmsee.ink",
    "https://www.javbus.com",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
}


async def fetch(code: str, base_urls: list[str] | None = None) -> dict | None:
    """
    Query Javbus for a JAV product code.
    Tries each domain in base_urls (or _BASE_URLS if not provided) until one succeeds.
    Returns a metadata dict or None if not found.
    """
    urls = base_urls if base_urls else _BASE_URLS
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        for base_url in urls:
            result = await _fetch_from(client, base_url, code)
            if result is not None:
                return result
    return None


async def _fetch_from(client: httpx.AsyncClient, base_url: str, code: str) -> dict | None:
    url = f"{base_url}/{code}"
    try:
        resp = await client.get(url)
        if resp.status_code in (403, 429, 503):
            return None
        if resp.status_code != 200:
            return None
        return _parse(resp.text, code, base_url)
    except httpx.RequestError:
        return None


def _parse(html: str, code: str, base_url: str = "") -> dict | None:
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
    if cover_url:
        if cover_url.startswith("//"):
            cover_url = "https:" + cover_url
        elif cover_url.startswith("/"):
            cover_url = base_url + cover_url

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
