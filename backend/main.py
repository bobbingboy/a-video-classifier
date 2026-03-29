import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()

from backend.database import init_db
from backend.logger import get_logger, setup_logging
from backend.api import actors, browse, scan, scrapers, tags, videos

setup_logging()
log = get_logger("api")

app = FastAPI(title="Video Library")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse({"detail": str(exc)}, status_code=500)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:
        elapsed = (time.perf_counter() - start) * 1000
        log.error("%-6s %-40s  ERROR %.0fms — %s", request.method, request.url.path, elapsed, exc, exc_info=True)
        return JSONResponse({"detail": str(exc)}, status_code=500)
    elapsed = (time.perf_counter() - start) * 1000
    level = log.warning if response.status_code >= 400 else log.info
    level("%-6s %-40s  %d  %.0fms", request.method, request.url.path, response.status_code, elapsed)
    return response


# Serve cover images as static files
covers_dir = Path(__file__).parent.parent / "covers"
covers_dir.mkdir(exist_ok=True)
app.mount("/covers", StaticFiles(directory=str(covers_dir)), name="covers")

# Serve actor photos as static files
actor_photos_dir = Path(__file__).parent.parent / "actor_photos"
actor_photos_dir.mkdir(exist_ok=True)
app.mount("/actor_photos", StaticFiles(directory=str(actor_photos_dir)), name="actor_photos")

app.include_router(videos.router)
app.include_router(scan.router)
app.include_router(actors.router)
app.include_router(tags.router)
app.include_router(browse.router)
app.include_router(scrapers.router)


@app.on_event("startup")
def startup():
    init_db()
