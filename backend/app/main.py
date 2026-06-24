from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, habits, habit_logs, checkins, reports

app = FastAPI(
    title="Rumbo API",
    description="Sistema personal de habitos y mejora continua",
    version="1.0.0",
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


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Rumbo"}
