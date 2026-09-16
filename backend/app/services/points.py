from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.daily_checkin import DailyCheckin
from app.models.habit_log import HabitLog


def daily_habit_points(db: Session, user_id: str, log_date: date) -> int:
    value = db.query(func.coalesce(func.sum(HabitLog.points), 0)).filter(
        HabitLog.user_id == user_id,
        HabitLog.log_date == log_date,
    ).scalar()
    return int(value or 0)


def sync_daily_checkin_points(db: Session, user_id: str, log_date: date) -> int:
    points = daily_habit_points(db, user_id, log_date)
    checkin = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == user_id,
        DailyCheckin.checkin_date == log_date,
    ).first()
    if checkin is not None:
        checkin.points = points
    return points
