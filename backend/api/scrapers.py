import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import ScraperSource, ScraperStats

router = APIRouter(prefix="/api/scrapers", tags=["scrapers"])

PRESETS_DIR = Path(__file__).parent.parent / "scrapers" / "presets"


# ── Schemas ───────────────────────────────────────────────────────────────────

class SourceBase(BaseModel):
    name: str
    enabled: bool = True
    parse_mode: str                        # "builtin" | "selectors"
    builtin_key: str | None = None
    base_urls: list[str]
    access_mode: str = "direct"            # "direct" | "search"
    search_url_pattern: str | None = None
    result_link_selector: str | None = None
    result_code_selector: str | None = None
    selectors: dict[str, Any] | None = None


class SourceCreate(SourceBase):
    pass


class SourceUpdate(SourceBase):
    pass


class StatsOut(BaseModel):
    attempts: int
    successes: int
    success_rate: float | None
    in_cooldown: bool
    cooldown_until: datetime | None

    class Config:
        from_attributes = True


class SourceOut(SourceBase):
    id: int
    created_at: datetime
    stats: StatsOut | None

    class Config:
        from_attributes = True


class PresetInfo(BaseModel):
    name: str
    display_name: str
    source_count: int
    already_imported: bool


class ImportResult(BaseModel):
    imported: int
    skipped: int


class TestRequest(BaseModel):
    code: str
    name: str = "test"
    parse_mode: str
    builtin_key: str | None = None
    base_urls: list[str]
    access_mode: str = "direct"
    search_url_pattern: str | None = None
    result_link_selector: str | None = None
    result_code_selector: str | None = None
    selectors: dict[str, Any] | None = None


class TestResult(BaseModel):
    found: bool
    attempted_urls: list[str] = []
    title: str | None = None
    cover_url: str | None = None
    studio: str | None = None
    release_date: str | None = None
    actors: list[str] = []
    tags: list[str] = []
    source: str | None = None
    error: str | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _build_stats_out(stats: ScraperStats | None) -> StatsOut | None:
    if stats is None:
        return None
    now = _now_utc()
    in_cooldown = bool(stats.cooldown_until and stats.cooldown_until > now)
    success_rate = (stats.successes / stats.attempts) if stats.attempts > 0 else None
    return StatsOut(
        attempts=stats.attempts,
        successes=stats.successes,
        success_rate=success_rate,
        in_cooldown=in_cooldown,
        cooldown_until=stats.cooldown_until,
    )


def _source_to_out(src: ScraperSource) -> SourceOut:
    return SourceOut(
        id=src.id,
        name=src.name,
        enabled=src.enabled,
        parse_mode=src.parse_mode,
        builtin_key=src.builtin_key,
        base_urls=src.base_urls or [],
        access_mode=src.access_mode,
        search_url_pattern=src.search_url_pattern,
        result_link_selector=src.result_link_selector,
        result_code_selector=src.result_code_selector,
        selectors=src.selectors,
        created_at=src.created_at,
        stats=_build_stats_out(src.stats),
    )


def _load_preset_file(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ── Sources CRUD ──────────────────────────────────────────────────────────────

@router.get("/sources", response_model=list[SourceOut])
def list_sources(db: Session = Depends(get_db)):
    sources = db.query(ScraperSource).order_by(ScraperSource.id).all()
    return [_source_to_out(s) for s in sources]


@router.post("/sources", response_model=SourceOut, status_code=201)
def create_source(body: SourceCreate, db: Session = Depends(get_db)):
    if db.query(ScraperSource).filter_by(name=body.name).first():
        raise HTTPException(status_code=422, detail="名稱已存在")
    src = ScraperSource(**body.model_dump())
    db.add(src)
    db.flush()
    stats = ScraperStats(source_id=src.id)
    db.add(stats)
    db.commit()
    db.refresh(src)
    return _source_to_out(src)


@router.put("/sources/{source_id}", response_model=SourceOut)
def update_source(source_id: int, body: SourceUpdate, db: Session = Depends(get_db)):
    src = db.get(ScraperSource, source_id)
    if src is None:
        raise HTTPException(status_code=404, detail="來源不存在")
    conflict = db.query(ScraperSource).filter(
        ScraperSource.name == body.name,
        ScraperSource.id != source_id,
    ).first()
    if conflict:
        raise HTTPException(status_code=422, detail="名稱已存在")
    for field, val in body.model_dump().items():
        setattr(src, field, val)
    db.commit()
    db.refresh(src)
    return _source_to_out(src)


@router.delete("/sources/{source_id}", status_code=204)
def delete_source(source_id: int, db: Session = Depends(get_db)):
    src = db.get(ScraperSource, source_id)
    if src is None:
        raise HTTPException(status_code=404, detail="來源不存在")
    db.delete(src)
    db.commit()


# ── Test ─────────────────────────────────────────────────────────────────────

@router.post("/sources/test", response_model=TestResult)
async def test_source(body: TestRequest) -> TestResult:
    """執行一次 fetch 以驗證來源設定是否正確，不寫入資料庫。"""
    code = body.code.strip().upper()
    if not code:
        raise HTTPException(status_code=422, detail="測試番號不可為空")

    attempted_urls: list[str] = []

    try:
        if body.parse_mode == "builtin":
            import importlib
            _BUILTIN_MODULES = {
                "javbus": "backend.scrapers.javbus",
                "javdb": "backend.scrapers.javdb",
                "avsox": "backend.scrapers.avsox",
                "javlib": "backend.scrapers.javlib",
            }
            mod_name = _BUILTIN_MODULES.get(body.builtin_key or "")
            if not mod_name:
                return TestResult(found=False, error=f"未知的 builtin_key：{body.builtin_key!r}")
            # Compute expected URLs from access_mode and pattern (builtin internal URLs)
            for base in (body.base_urls or []):
                if body.access_mode == "search" and body.search_url_pattern:
                    attempted_urls.append(
                        body.search_url_pattern.replace("{base}", base).replace("{code}", code)
                    )
                else:
                    attempted_urls.append(f"{base}/{code}")
            mod = importlib.import_module(mod_name)
            result = await mod.fetch(code, base_urls=body.base_urls or None)

        elif body.parse_mode == "selectors":
            from backend.scrapers.selector_engine import fetch as sel_fetch
            result = await sel_fetch(
                code=code,
                source_name=body.name,
                base_urls=body.base_urls or [],
                access_mode=body.access_mode,
                search_url_pattern=body.search_url_pattern,
                result_link_selector=body.result_link_selector,
                result_code_selector=body.result_code_selector,
                selectors=body.selectors or {},
                _log=attempted_urls,
            )
        else:
            return TestResult(found=False, error=f"未知的 parse_mode：{body.parse_mode!r}")

    except Exception as e:
        return TestResult(found=False, attempted_urls=attempted_urls, error=str(e))

    if not result:
        return TestResult(found=False, attempted_urls=attempted_urls)

    return TestResult(
        found=True,
        attempted_urls=attempted_urls,
        title=result.get("title"),
        cover_url=result.get("cover_url"),
        studio=result.get("studio"),
        release_date=result.get("release_date"),
        actors=result.get("actors") or [],
        tags=result.get("tags") or [],
        source=result.get("source"),
    )


# ── Presets ───────────────────────────────────────────────────────────────────

@router.get("/presets", response_model=list[PresetInfo])
def list_presets(db: Session = Depends(get_db)):
    existing_names = {r[0] for r in db.query(ScraperSource.name).all()}
    result = []
    for path in sorted(PRESETS_DIR.glob("*.json")):
        data = _load_preset_file(path)
        sources = data.get("sources", [])
        already = all(s["name"] in existing_names for s in sources) and len(sources) > 0
        result.append(PresetInfo(
            name=data["name"],
            display_name=data.get("display_name", data["name"]),
            source_count=len(sources),
            already_imported=already,
        ))
    return result


@router.post("/presets/{preset_name}/import", response_model=ImportResult)
def import_preset(preset_name: str, db: Session = Depends(get_db)):
    path = PRESETS_DIR / f"{preset_name}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Preset 不存在")
    data = _load_preset_file(path)
    existing_names = {r[0] for r in db.query(ScraperSource.name).all()}

    imported = 0
    skipped = 0
    for s in data.get("sources", []):
        if s["name"] in existing_names:
            skipped += 1
            continue
        src = ScraperSource(
            name=s["name"],
            enabled=True,
            parse_mode=s.get("parse_mode", "builtin"),
            builtin_key=s.get("builtin_key"),
            base_urls=s.get("base_urls", []),
            access_mode=s.get("access_mode", "direct"),
            search_url_pattern=s.get("search_url_pattern"),
            result_link_selector=s.get("result_link_selector"),
            result_code_selector=s.get("result_code_selector"),
            selectors=s.get("selectors"),
        )
        db.add(src)
        db.flush()
        db.add(ScraperStats(source_id=src.id))
        imported += 1

    db.commit()
    return ImportResult(imported=imported, skipped=skipped)
