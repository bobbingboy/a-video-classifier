import httpx
from bs4 import BeautifulSoup

_BASE_URLS = [
    "https://avsox.click",
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
    Query Avsox for a JAV product code.
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
    search_url = f"{base_url}/cn/search/{code}"
    try:
        resp = await client.get(search_url)
        if resp.status_code in (403, 429, 503):
            return None
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")
        detail_path = _find_exact_result(soup, code)
        if not detail_path:
            return None

        detail_url = base_url + detail_path
        detail_resp = await client.get(detail_url)
        if detail_resp.status_code != 200:
            return None

        return _parse(detail_resp.text, code)
    except httpx.RequestError:
        return None


def _find_exact_result(soup: BeautifulSoup, code: str) -> str | None:
    """Return the href of the first result whose title contains the exact code."""
    for box in soup.select("div.photo-info"):
        span = box.select_one("span")
        if span and code.upper() in span.text.upper():
            link = box.find_parent("a")
            if link:
                href = link.get("href", "")
                # Return only the path portion
                if href.startswith("http"):
                    from urllib.parse import urlparse
                    return urlparse(href).path
                return href
    return None


def _parse(html: str, code: str) -> dict | None:
    soup = BeautifulSoup(html, "html.parser")

    title_tag = soup.select_one("div.container h3")
    title = title_tag.text.strip() if title_tag else None
    if not title:
        return None

    cover_tag = soup.select_one("a.bigImage img") or soup.select_one("div.screencap img")
    cover_url = cover_tag.get("src") if cover_tag else None
    if cover_url and cover_url.startswith("//"):
        cover_url = "https:" + cover_url

    info: dict[str, str] = {}
    for p in soup.select("div.info p"):
        label_tag = p.find("span", class_="header")
        if not label_tag:
            continue
        label = label_tag.text.strip().rstrip(":")
        value_tag = p.find("a") or p.find("span", class_=False)
        value = value_tag.text.strip() if value_tag else p.text.replace(label, "").strip().strip(":")
        info[label] = value

    actors = [a.text.strip() for a in soup.select("div#avatar-waterfall a.avatar-box span")]
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
        "source": "avsox",
    }
