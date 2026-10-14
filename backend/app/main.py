import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security_events import get_client_ip, log_event, purge_old_events
from app.database import engine, Base
from app.routers import auth, students, elections, candidates, votes, announcements, admin

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    purge_old_events(settings.EVENT_RETENTION_DAYS)
    yield


docs_kwargs = {}
if settings.is_production:
    # Hide interactive docs and the API schema from the public internet
    docs_kwargs = {"docs_url": None, "redoc_url": None, "openapi_url": None}

app = FastAPI(title="TUCUSA VOTE API", version="1.0.0", lifespan=lifespan, **docs_kwargs)

MAX_BODY_BYTES = settings.MAX_REQUEST_BODY_MB * 1024 * 1024


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    if request.url.path != "/health":
        ip = get_client_ip(request)
        if not limiter.hit(f"global:{ip}", settings.GLOBAL_RATE_LIMIT_PER_MINUTE, 60):
            if limiter.hit(f"global-log:{ip}", 1, 300):
                await run_in_threadpool(
                    log_event, "rate_limited", "warning", request, detail="global per-IP limit exceeded"
                )
            return JSONResponse({"detail": "Too many requests"}, status_code=429, headers={"Retry-After": "60"})

    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
        return JSONResponse({"detail": "Request too large"}, status_code=413)

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    if request.url.path.startswith("/api"):
        response.headers["Cache-Control"] = "no-store"
    return response


origins = []
if not settings.is_production:
    origins += ["http://localhost:5173", "http://localhost:5174"]
for url in (settings.FRONTEND_URL, settings.ADMIN_URL):
    if url:
        origins.append(url.strip().rstrip("/"))

# Added last so it is the outermost middleware (CORS headers also appear on 429/413 responses)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # Bearer tokens in headers, no cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(elections.router)
app.include_router(candidates.router)
app.include_router(votes.router)
app.include_router(announcements.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "TUCUSA VOTE API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}