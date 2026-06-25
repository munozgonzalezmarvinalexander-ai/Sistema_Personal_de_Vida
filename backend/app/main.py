from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.database import SessionLocal
from app.routers import auth, habits, habit_logs, checkins, reports, experiments, habit_library, gamification, reminders, export, insights
from app.seed_library import seed_library


@asynccontextmanager
async def lifespan(application: FastAPI):
    db = SessionLocal()
    try:
        seed_library(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Rumbo API",
    description="Sistema personal de habitos y mejora continua",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

if settings.is_production:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


app.include_router(auth.router, prefix="/api")
app.include_router(habits.router, prefix="/api")
app.include_router(habit_logs.router, prefix="/api")
app.include_router(checkins.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(habit_library.router, prefix="/api")
app.include_router(gamification.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(insights.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Rumbo", "environment": settings.ENVIRONMENT}
