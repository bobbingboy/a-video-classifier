import asyncio
import importlib
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx

from backend.logger import get_logger

log = get_logger("dispatcher")

COVERS_DIR = Path(__file__).parent.parent.parent / "covers"

FAILURE_BARRIER = 5
COOLDOWN_MINUTES = 30

# Map builtin_key → module name within backend.scrapers
_BUILTIN_MODULES: dict[str, str] = {
    "javbus": "backend.scrapers.javbus",
    "javdb": "backend.scrapers.javdb",
    "avsox": "backend.scrapers.avsox",
    "javlib": "backend.scrapers.javlib",
}


def _now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _effective_weight(stats) -> float:
    """Return weight (0.0–1.0). New sources with no attempts get 1.0."""
    if stats is None or stats.attempts == 0:
        return 1.0
    return stats.successes / stats.attempts


def _is_cooling(stats) -> bool:
    if stats is None or stats.cooldown_until is None:
        return False
    return stats.cooldown_until > _now_utc()


async def _run_builtin(source, code: str) -> dict | None:
    key = source.builtin_key
    mod_name = _BUILTIN_MODULES.get(key)
    if not mod_name:
        log.error("未知的 builtin_key：%s（來源：%s）", key, source.name)
        return None
    try:
        mod = importlib.import_module(mod_name)
        return await mod.fetch(code, base_urls=source.base_urls or None)
    except Exception as e:
        log.warning("builtin 來源 %s 發生例外：%s", source.name, e)
        return None


async def _run_selectors(source, code: str) -> dict | None:
    from backend.scrapers.selector_engine import fetch as sel_fetch
    try:
        return await sel_fetch(
            code=code,
            source_name=source.name,
            base_urls=source.base_urls or [],
            access_mode=source.access_mode,
            search_url_pattern=source.search_url_pattern,
            result_link_selector=source.result_link_selector,
            result_code_selector=source.result_code_selector,
            selectors=source.selectors or {},
        )
    except Exception as e:
        log.warning("selectors 來源 %s 發生例外：%s", source.name, e)
        return None


async def _fetch_source(source, code: str) -> dict | None:
    if source.parse_mode == "builtin":
        return await _run_builtin(source, code)
    if source.parse_mode == "selectors":
        return await _run_selectors(source, code)
    log.error("未知的 parse_mode：%s（來源：%s）", source.parse_mode, source.name)
    return None


def _update_stats(db, stats, succeeded: bool) -> None:
    from backend.models import ScraperStats  # avoid circular import at module level
    now = _now_utc()
    stats.attempts += 1
    stats.last_attempt = now
    if succeeded:
        stats.successes += 1
        stats.consecutive_failures = 0
    else:
        stats.consecutive_failures += 1
        if stats.consecutive_failures >= FAILURE_BARRIER:
            stats.cooldown_until = now + timedelta(minutes=COOLDOWN_MINUTES)
            stats.consecutive_failures = 0
            log.info("來源進入冷卻：%s（冷卻至 %s）", stats.source.name, stats.cooldown_until)
    db.commit()


async def fetch_metadata(code: str, db=None) -> dict | None:
    """
    Dynamically load enabled scraper sources from DB, run them in parallel,
    and merge results weighted by success rate.
    Falls back to legacy behaviour if DB has no sources configured.
    """
    if db is None:
        # Provide a DB session for standalone callers (e.g. scanner)
        from backend.database import SessionLocal
        db = SessionLocal()
        _close_db = True
    else:
        _close_db = False

    try:
        return await _fetch_metadata_with_db(code, db)
    finally:
        if _close_db:
            db.close()


async def _fetch_metadata_with_db(code: str, db) -> dict | None:
    from backend.models import ScraperSource
    from backend.scrapers.tag_cleaner import clean_tags

    sources = (
        db.query(ScraperSource)
        .filter_by(enabled=True)
        .all()
    )

    # Fallback to legacy hardcoded behaviour when no sources are configured
    if not sources:
        return await _legacy_fetch(code)

    # Filter out sources currently in cooldown
    active = [s for s in sources if not _is_cooling(s.stats)]
    if not active:
        log.warning("所有來源均在冷卻中，無法取得 metadata：%s", code)
        return None

    # Sort by weight descending so merge priority aligns with weight
    active.sort(key=lambda s: _effective_weight(s.stats), reverse=True)

    # Run all active sources in parallel
    raw_results = await asyncio.gather(
        *[_fetch_source(s, code) for s in active],
        return_exceptions=True,
    )

    results: list[dict | None] = []
    for source, raw in zip(active, raw_results):
        if isinstance(raw, Exception):
            succeeded = False
            result = None
        else:
            succeeded = isinstance(raw, dict)
            result = raw if succeeded else None
        _update_stats(db, source.stats, succeeded)
        results.append(result)

    if not any(results):
        return None

    # Merge: higher-weight sources (earlier in list) take field priority
    primary_fields = ("title", "cover_url", "studio", "actors", "release_date")
    merged: dict = {"source": next(r["source"] for r in results if r)}
    for field in primary_fields:
        for r in results:
            if r and r.get(field):
                merged[field] = r[field]
                break

    seen: set[str] = set()
    all_tags: list[str] = []
    for r in results:
        for tag in (r.get("tags") or []) if r else []:
            if tag not in seen:
                seen.add(tag)
                all_tags.append(tag)

    merged["tags"] = await clean_tags(all_tags)
    return merged


async def _legacy_fetch(code: str) -> dict | None:
    """Original hardcoded behaviour, used only when DB has no sources configured."""
    from backend.scrapers import ai_fallback, avsox, javbus, javdb, javlib
    from backend.scrapers.tag_cleaner import clean_tags

    log.warning("未設定任何來源，使用舊版硬編碼 dispatcher")
    raw = await asyncio.gather(
        javbus.fetch(code),
        javdb.fetch(code),
        avsox.fetch(code),
        javlib.fetch(code),
        ai_fallback.fetch(code),
        return_exceptions=True,
    )
    sources = [r if isinstance(r, dict) else None for r in raw]
    if not any(sources):
        return None

    primary_fields = ("title", "cover_url", "studio", "actors", "release_date")
    merged: dict = {"source": next(s["source"] for s in sources if s)}
    for field in primary_fields:
        for s in sources:
            if s and s.get(field):
                merged[field] = s[field]
                break

    seen: set[str] = set()
    all_tags: list[str] = []
    for s in sources:
        for tag in (s.get("tags") or []) if s else []:
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
