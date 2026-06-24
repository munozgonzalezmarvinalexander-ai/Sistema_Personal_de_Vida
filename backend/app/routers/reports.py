from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.daily_checkin import DailyCheckin
from app.models.habit import Habit
from app.models.habit_log import HabitLog
from app.models.user import User
from app.schemas.report import WeeklyReport, HabitReport

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/weekly", response_model=WeeklyReport)
def weekly_report(
    start_date: date = Query(..., description="Lunes de la semana (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    end_date = start_date + timedelta(days=6)

    checkins = (
        db.query(DailyCheckin)
        .filter(
            DailyCheckin.user_id == current_user.id,
            DailyCheckin.checkin_date >= start_date,
            DailyCheckin.checkin_date <= end_date,
        )
        .all()
    )

    days_logged = len(checkins)
    total_points = sum(c.points for c in checkins)
    sleep_vals = [float(c.sleep_hours) for c in checkins if c.sleep_hours is not None]
    mood_vals = [c.mood for c in checkins if c.mood is not None]
    energy_vals = [c.energy for c in checkins if c.energy is not None]

    avg_sleep = round(sum(sleep_vals) / len(sleep_vals), 1) if sleep_vals else None
    avg_mood = round(sum(mood_vals) / len(mood_vals), 1) if mood_vals else None
    avg_energy = round(sum(energy_vals) / len(energy_vals), 1) if energy_vals else None

    total_study = sum(c.university_study_minutes or 0 for c in checkins)
    total_english = sum(c.english_minutes or 0 for c in checkins)
    total_programming = sum(c.programming_minutes or 0 for c in checkins)
    total_reading = sum(c.reading_minutes or 0 for c in checkins)
    total_meditation = sum(c.meditation_minutes or 0 for c in checkins)

    habit_stats = (
        db.query(
            HabitLog.habit_id,
            func.count(HabitLog.id).label("days_completed"),
            func.sum(HabitLog.points).label("total_points"),
        )
        .filter(
            HabitLog.user_id == current_user.id,
            HabitLog.log_date >= start_date,
            HabitLog.log_date <= end_date,
            HabitLog.completed.is_(True),
        )
        .group_by(HabitLog.habit_id)
        .all()
    )

    habits_map = {
        h.id: h for h in db.query(Habit).filter(Habit.user_id == current_user.id).all()
    }

    habit_reports = []
    for hs in habit_stats:
        habit = habits_map.get(hs.habit_id)
        if habit:
            habit_reports.append(
                HabitReport(
                    habit_id=hs.habit_id,
                    name=habit.name,
                    category=habit.category,
                    days_completed=hs.days_completed,
                    total_points=int(hs.total_points or 0),
                )
            )

    sorted_reports = sorted(habit_reports, key=lambda r: r.days_completed, reverse=True)

    return WeeklyReport(
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
        total_points=total_points,
        days_logged=days_logged,
        avg_sleep=avg_sleep,
        avg_mood=avg_mood,
        avg_energy=avg_energy,
        total_study_minutes=total_study,
        total_english_minutes=total_english,
        total_programming_minutes=total_programming,
        total_reading_minutes=total_reading,
        total_meditation_minutes=total_meditation,
        habits_most_completed=sorted_reports[:3],
        habits_least_completed=sorted_reports[-3:] if len(sorted_reports) > 3 else sorted_reports,
    )
