from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import SessionLocal
from app.routers import auth, habits, habit_logs, checkins, reports, experiments, habit_library
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
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(habits.router, prefix="/api")
app.include_router(habit_logs.router, prefix="/api")
app.include_router(checkins.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(habit_library.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Rumbo"}
