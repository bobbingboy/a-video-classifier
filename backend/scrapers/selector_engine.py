"""
Generic scraper engine driven by CSS-selector configuration.
Supports direct URL access and search-then-detail access modes.
"""
from __future__ import annotations

from typing import Any

import httpx
from bs4 import BeautifulSoup

from backend.logger import get_logger

log = get_logger("selector_engine")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
}


async def fetch(
    code: str,
    source_name: str,
    base_urls: list[str],
    access_mode: str,
    search_url_pattern: str | None,
    result_link_selector: str | None,
    result_code_selector: str | None,
    selectors: dict[str, Any],
    _log: list[str] | None = None,
) -> dict | None:
    """
    Fetch metadata for `code` using user-configured CSS selectors.
    Returns a metadata dict or None if not found.
    Pass _log to collect the actual URLs attempted (for test/debug use).
    """
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        for base_url in base_urls:
            result = await _fetch_from(
                client, code, source_name, base_url,
                access_mode, search_url_pattern,
                result_link_selector, result_code_selector,
                selectors, _log,
            )
            if result is not None:
                return result
    return None


async def _fetch_from(
    client: httpx.AsyncClient,
    code: str,
    source_name: str,
    base_url: str,
    access_mode: str,
    search_url_pattern: str | None,
    result_link_selector: str | None,
    result_code_selector: str | None,
    selectors: dict[str, Any],
    _log: list[str] | None = None,
) -> dict | None:
    try:
        if access_mode == "direct":
            detail_url = f"{base_url}/{code}"
            if _log is not None:
                _log.append(detail_url)
            resp = await client.get(detail_url)
            if resp.status_code != 200:
                return None
            return _parse(resp.text, code, source_name, base_url, selectors)

        # search mode
        if not search_url_pattern:
            raise ValueError("search 模式缺少「搜尋 URL 模板」（search_url_pattern）")
        if not result_link_selector:
            raise ValueError("search 模式缺少「結果連結 Selector」（result_link_selector）")

        search_url = search_url_pattern.replace("{base}", base_url).replace("{code}", code)
        if _log is not None:
            _log.append(search_url)
        resp = await client.get(search_url)
        if resp.status_code in (403, 429, 503) or resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")
        detail_href = _find_result_link(soup, code, result_link_selector, result_code_selector)
        if not detail_href:
            return None

        if detail_href.startswith("http"):
            detail_url = detail_href
        elif detail_href.startswith("/"):
            detail_url = base_url + detail_href
        else:
            detail_url = base_url + "/" + detail_href

        if _log is not None:
            _log.append(detail_url)
        detail_resp = await client.get(detail_url)
        if detail_resp.status_code != 200:
            return None
        return _parse(detail_resp.text, code, source_name, base_url, selectors)

    except httpx.RequestError as e:
        log.debug("連線錯誤 %s [%s]: %s", source_name, base_url, e)
        return None


def _find_result_link(
    soup: BeautifulSoup,
    code: str,
    link_selector: str,
    code_selector: str | None,
) -> str | None:
    """Find the first result link. If code_selector is given, verify exact code match."""
    if code_selector:
        # Try to find an element whose text matches the code, then get its parent link
        for el in soup.select(code_selector):
            if el.get_text(strip=True).upper() == code.upper():
                link = el.find_parent("a") or el.select_one("a")
                if link:
                    return link.get("href")
        return None

    # No code verification — take the first link
    link = soup.select_one(link_selector)
    return link.get("href") if link else None


def _parse(
    html: str,
    code: str,
    source_name: str,
    base_url: str,
    selectors: dict[str, Any],
) -> dict | None:
    soup = BeautifulSoup(html, "html.parser")
    fields = selectors.get("fields", selectors)  # support both wrapped and flat formats

    def extract(key: str) -> str | list[str] | None:
        cfg = fields.get(key)
        if not cfg:
            return None
        sel = cfg.get("selector") if isinstance(cfg, dict) else cfg
        attr = cfg.get("attr") if isinstance(cfg, dict) else None
        multiple = cfg.get("multiple", False) if isinstance(cfg, dict) else False

        if multiple:
            els = soup.select(sel)
            return [
                (el.get(attr, "") if attr else el.get_text(strip=True))
                for el in els
                if (el.get(attr) if attr else el.get_text(strip=True))
            ]
        el = soup.select_one(sel)
        if el is None:
            return None
        val = el.get(attr, "") if attr else el.get_text(strip=True)
        # Resolve relative URLs for cover
        if attr == "src" and val and val.startswith("//"):
            val = "https:" + val
        elif attr == "src" and val and val.startswith("/"):
            val = base_url + val
        return val or None

    title = extract("title")
    if not title:
        return None

    return {
        "code": code,
        "title": title,
        "cover_url": extract("cover_url"),
        "studio": extract("studio"),
        "release_date": extract("release_date"),
        "actors": extract("actors") or [],
        "tags": extract("tags") or [],
        "source": source_name,
    }
