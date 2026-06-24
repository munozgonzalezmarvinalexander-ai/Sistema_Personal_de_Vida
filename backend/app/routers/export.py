import csv
import io
from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.habit import Habit
from app.models.habit_log import HabitLog
from app.models.daily_checkin import DailyCheckin
from app.models.experiment import Experiment
from app.models.achievement import Achievement
from app.models.reminder_settings import ReminderSettings

router = APIRouter(prefix="/export", tags=["export"])


def _today_str() -> str:
    return date.today().isoformat()


def _to_dict(obj, exclude: set[str] | None = None) -> dict:
    exclude = exclude or set()
    result = {}
    for col in obj.__table__.columns:
        if col.name in exclude:
            continue
        val = getattr(obj, col.name)
        if isinstance(val, (datetime, date)):
            val = val.isoformat()
        elif isinstance(val, Decimal):
            val = float(val)
        result[col.name] = val
    return result


@router.get("/json")
def export_json(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = current_user.id

    user_data = _to_dict(current_user, exclude={"password_hash"})

    habits = [_to_dict(h) for h in db.query(Habit).filter(Habit.user_id == uid).order_by(Habit.created_at).all()]
    habit_logs = [_to_dict(l) for l in db.query(HabitLog).filter(HabitLog.user_id == uid).order_by(HabitLog.log_date).all()]
    checkins = [_to_dict(c) for c in db.query(DailyCheckin).filter(DailyCheckin.user_id == uid).order_by(DailyCheckin.checkin_date).all()]
    experiments = [_to_dict(e) for e in db.query(Experiment).filter(Experiment.user_id == uid).order_by(Experiment.created_at).all()]
    achievements = [_to_dict(a) for a in db.query(Achievement).filter(Achievement.user_id == uid).order_by(Achievement.unlocked_at).all()]

    reminder = db.query(ReminderSettings).filter(ReminderSettings.user_id == uid).first()
    reminder_data = _to_dict(reminder) if reminder else None

    export_data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "version": "1.0",
        "user": user_data,
        "habits": habits,
        "habit_logs": habit_logs,
        "daily_checkins": checkins,
        "experiments": experiments,
        "achievements": achievements,
        "reminder_settings": reminder_data,
    }

    import json
    content = json.dumps(export_data, ensure_ascii=False, indent=2)
    filename = f"rumbo_export_{_today_str()}.json"

    return StreamingResponse(
        iter([content]),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    if not rows:
        return StreamingResponse(
            iter(["No hay datos para exportar\n"]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    content = output.getvalue()
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/csv/checkins")
def export_checkins_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    checkins = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id
    ).order_by(DailyCheckin.checkin_date).all()

    rows = []
    for c in checkins:
        d = _to_dict(c, exclude={"id", "user_id"})
        rows.append(d)

    return _csv_response(rows, f"rumbo_checkins_{_today_str()}.csv")


@router.get("/csv/habits")
def export_habits_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habits = db.query(Habit).filter(
        Habit.user_id == current_user.id
    ).order_by(Habit.created_at).all()

    rows = []
    for h in habits:
        d = _to_dict(h, exclude={"id", "user_id"})
        rows.append(d)

    return _csv_response(rows, f"rumbo_habits_{_today_str()}.csv")


@router.get("/csv/experiments")
def export_experiments_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    experiments = db.query(Experiment).filter(
        Experiment.user_id == current_user.id
    ).order_by(Experiment.created_at).all()

    rows = []
    for e in experiments:
        d = _to_dict(e, exclude={"id", "user_id"})
        rows.append(d)

    return _csv_response(rows, f"rumbo_experiments_{_today_str()}.csv")
