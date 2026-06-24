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
from app.schemas.report import (
    WeeklyReport, HabitReport, ComparisonValue,
    TrendsResponse, TrendDay, StreakResponse,
)

router = APIRouter(prefix="/reports", tags=["reports"])


def _week_stats(db: Session, user_id: str, start: date, end: date):
    checkins = (
        db.query(DailyCheckin)
        .filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.checkin_date >= start,
            DailyCheckin.checkin_date <= end,
        )
        .all()
    )
    days_logged = len(checkins)
    total_points = sum(c.points for c in checkins)
    sleep_vals = [float(c.sleep_hours) for c in checkins if c.sleep_hours is not None]
    mood_vals = [c.mood for c in checkins if c.mood is not None]
    energy_vals = [c.energy for c in checkins if c.energy is not None]

    return {
        "checkins": checkins,
        "days_logged": days_logged,
        "total_points": total_points,
        "avg_sleep": round(sum(sleep_vals) / len(sleep_vals), 1) if sleep_vals else None,
        "avg_mood": round(sum(mood_vals) / len(mood_vals), 1) if mood_vals else None,
        "avg_energy": round(sum(energy_vals) / len(energy_vals), 1) if energy_vals else None,
        "total_study": sum(c.university_study_minutes or 0 for c in checkins),
        "total_english": sum(c.english_minutes or 0 for c in checkins),
        "total_programming": sum(c.programming_minutes or 0 for c in checkins),
        "total_reading": sum(c.reading_minutes or 0 for c in checkins),
        "total_meditation": sum(c.meditation_minutes or 0 for c in checkins),
    }


def _compare(current, previous) -> str:
    if current is None or previous is None:
        return "equal"
    if current > previous:
        return "up"
    if current < previous:
        return "down"
    return "equal"


@router.get("/weekly", response_model=WeeklyReport)
def weekly_report(
    start_date: date = Query(..., description="Lunes de la semana (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    end_date = start_date + timedelta(days=6)
    cur = _week_stats(db, current_user.id, start_date, end_date)

    prev_start = start_date - timedelta(days=7)
    prev_end = start_date - timedelta(days=1)
    prev = _week_stats(db, current_user.id, prev_start, prev_end)

    comparison = {
        "points": ComparisonValue(current=cur["total_points"], previous=prev["total_points"], direction=_compare(cur["total_points"], prev["total_points"])),
        "sleep": ComparisonValue(current=cur["avg_sleep"], previous=prev["avg_sleep"], direction=_compare(cur["avg_sleep"], prev["avg_sleep"])),
        "mood": ComparisonValue(current=cur["avg_mood"], previous=prev["avg_mood"], direction=_compare(cur["avg_mood"], prev["avg_mood"])),
        "energy": ComparisonValue(current=cur["avg_energy"], previous=prev["avg_energy"], direction=_compare(cur["avg_energy"], prev["avg_energy"])),
        "study": ComparisonValue(current=cur["total_study"], previous=prev["total_study"], direction=_compare(cur["total_study"], prev["total_study"])),
        "english": ComparisonValue(current=cur["total_english"], previous=prev["total_english"], direction=_compare(cur["total_english"], prev["total_english"])),
        "programming": ComparisonValue(current=cur["total_programming"], previous=prev["total_programming"], direction=_compare(cur["total_programming"], prev["total_programming"])),
        "reading": ComparisonValue(current=cur["total_reading"], previous=prev["total_reading"], direction=_compare(cur["total_reading"], prev["total_reading"])),
        "meditation": ComparisonValue(current=cur["total_meditation"], previous=prev["total_meditation"], direction=_compare(cur["total_meditation"], prev["total_meditation"])),
    }

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
        total_points=cur["total_points"],
        days_logged=cur["days_logged"],
        avg_sleep=cur["avg_sleep"],
        avg_mood=cur["avg_mood"],
        avg_energy=cur["avg_energy"],
        total_study_minutes=cur["total_study"],
        total_english_minutes=cur["total_english"],
        total_programming_minutes=cur["total_programming"],
        total_reading_minutes=cur["total_reading"],
        total_meditation_minutes=cur["total_meditation"],
        habits_most_completed=sorted_reports[:3],
        habits_least_completed=sorted_reports[-3:] if len(sorted_reports) > 3 else sorted_reports,
        comparison=comparison,
    )


@router.get("/trends", response_model=TrendsResponse)
def trends(
    days: int = Query(14, ge=7, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    end = date.today()
    start = end - timedelta(days=days - 1)

    checkins = (
        db.query(DailyCheckin)
        .filter(
            DailyCheckin.user_id == current_user.id,
            DailyCheckin.checkin_date >= start,
            DailyCheckin.checkin_date <= end,
        )
        .all()
    )
    checkin_map = {c.checkin_date: c for c in checkins}

    habit_points_by_date = {}
    logs = (
        db.query(HabitLog.log_date, func.sum(HabitLog.points))
        .filter(
            HabitLog.user_id == current_user.id,
            HabitLog.log_date >= start,
            HabitLog.log_date <= end,
        )
        .group_by(HabitLog.log_date)
        .all()
    )
    for log_date, pts in logs:
        habit_points_by_date[log_date] = int(pts or 0)

    data = []
    current = start
    while current <= end:
        c = checkin_map.get(current)
        hp = habit_points_by_date.get(current, 0)
        checkin_pts = c.points if c else 0
        total_pts = max(hp, checkin_pts)
        data.append(TrendDay(
            date=current.isoformat(),
            points=total_pts,
            sleep_hours=float(c.sleep_hours) if c and c.sleep_hours is not None else None,
            mood=c.mood if c else None,
            energy=c.energy if c else None,
            water_liters=float(c.water_liters) if c and c.water_liters is not None else None,
            university_study_minutes=c.university_study_minutes or 0 if c else 0,
            english_minutes=c.english_minutes or 0 if c else 0,
            programming_minutes=c.programming_minutes or 0 if c else 0,
            reading_minutes=c.reading_minutes or 0 if c else 0,
            meditation_minutes=c.meditation_minutes or 0 if c else 0,
        ))
        current += timedelta(days=1)

    return TrendsResponse(days=days, data=data)


@router.get("/streaks", response_model=StreakResponse)
def streaks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    end = date.today()
    start = end - timedelta(days=89)

    checkins = (
        db.query(DailyCheckin.checkin_date, DailyCheckin.points)
        .filter(
            DailyCheckin.user_id == current_user.id,
            DailyCheckin.checkin_date >= start,
            DailyCheckin.checkin_date <= end,
        )
        .all()
    )
    checkin_points = {c.checkin_date: c.points for c in checkins}

    habit_dates = set(
        row[0] for row in
        db.query(HabitLog.log_date)
        .filter(
            HabitLog.user_id == current_user.id,
            HabitLog.log_date >= start,
            HabitLog.log_date <= end,
            HabitLog.completed.is_(True),
        )
        .distinct()
        .all()
    )

    active_dates = set()
    current = start
    while current <= end:
        pts = checkin_points.get(current, 0)
        has_habit = current in habit_dates
        if pts > 0 or has_habit:
            active_dates.add(current)
        current += timedelta(days=1)

    total_days = (end - start).days + 1

    current_streak = 0
    best_streak = 0
    streak = 0
    consecutive_misses = 0

    current = start
    while current <= end:
        if current in active_dates:
            consecutive_misses = 0
            streak += 1
        else:
            consecutive_misses += 1
            if consecutive_misses >= 2:
                best_streak = max(best_streak, streak)
                streak = 0
                consecutive_misses = 0
        current += timedelta(days=1)

    best_streak = max(best_streak, streak)
    current_streak = streak

    week_start = end - timedelta(days=end.weekday())
    grace_days = 0
    d = week_start
    prev_active = True
    while d <= end:
        if d not in active_dates:
            if prev_active:
                grace_days += 1
            prev_active = False
        else:
            prev_active = True
        d += timedelta(days=1)

    return StreakResponse(
        current_streak=current_streak,
        best_streak=best_streak,
        grace_days_used_this_week=grace_days,
        total_active_days=len(active_dates),
        total_days_checked=total_days,
    )
