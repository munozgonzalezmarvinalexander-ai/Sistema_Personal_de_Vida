from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.dates import today_local
from app.core.deps import get_current_user
from app.models.achievement import Achievement
from app.models.daily_checkin import DailyCheckin
from app.models.habit_log import HabitLog
from app.models.habit import Habit
from app.models.experiment import Experiment
from app.models.user import User
from app.schemas.gamification import (
    UserProgressOut, AchievementsListOut, AchievementOut,
    AchievementDefinition, RecalculateOut, calc_level,
)
from app.seed import DEFAULT_HABITS
from app.services.achievements import ACHIEVEMENT_DEFS, unlock_achievement

router = APIRouter(prefix="/gamification", tags=["gamification"])

def _get_total_points(db: Session, user_id: str) -> int:
    result = db.query(func.sum(HabitLog.points)).filter(
        HabitLog.user_id == user_id
    ).scalar()
    return int(result or 0)


def _calc_best_streak(db: Session, user_id: str) -> int:
    end = today_local()
    start = end - timedelta(days=89)
    checkin_dates = set(
        row[0] for row in
        db.query(DailyCheckin.checkin_date)
        .filter(DailyCheckin.user_id == user_id, DailyCheckin.checkin_date >= start)
        .all()
    )
    habit_dates = set(
        row[0] for row in
        db.query(HabitLog.log_date)
        .filter(HabitLog.user_id == user_id, HabitLog.log_date >= start, HabitLog.completed.is_(True))
        .distinct().all()
    )
    active = checkin_dates | habit_dates
    best = 0
    streak = 0
    misses = 0
    d = start
    while d <= end:
        if d in active:
            misses = 0
            streak += 1
        else:
            misses += 1
            if misses >= 2:
                best = max(best, streak)
                streak = 0
                misses = 0
        d += timedelta(days=1)
    return max(best, streak)


def recalculate_achievements(db: Session, user_id: str) -> list[str]:
    new_codes: list[str] = []

    checkin_count = db.query(func.count(DailyCheckin.id)).filter(
        DailyCheckin.user_id == user_id
    ).scalar() or 0

    if checkin_count >= 1:
        r = unlock_achievement(db, user_id, "first_checkin")
        if r:
            new_codes.append(r)

    if checkin_count >= 7:
        r = unlock_achievement(db, user_id, "seven_checkins")
        if r:
            new_codes.append(r)

    checkin_dates = [
        row[0] for row in
        db.query(DailyCheckin.checkin_date)
        .filter(DailyCheckin.user_id == user_id)
        .order_by(DailyCheckin.checkin_date).all()
    ]
    if len(checkin_dates) >= 2:
        for i in range(1, len(checkin_dates)):
            if (checkin_dates[i] - checkin_dates[i - 1]).days >= 2:
                r = unlock_achievement(db, user_id, "three_day_return")
                if r:
                    new_codes.append(r)
                break

    default_names = {habit["name"] for habit in DEFAULT_HABITS}
    custom_habit = db.query(Habit.id).filter(
        Habit.user_id == user_id,
        Habit.name.notin_(default_names),
    ).first()
    if custom_habit:
        r = unlock_achievement(db, user_id, "habit_creator")
        if r:
            new_codes.append(r)

    exp_total = db.query(func.count(Experiment.id)).filter(Experiment.user_id == user_id).scalar() or 0
    if exp_total >= 1:
        r = unlock_achievement(db, user_id, "experiment_started")
        if r:
            new_codes.append(r)

    exp_completed = db.query(func.count(Experiment.id)).filter(
        Experiment.user_id == user_id, Experiment.status == "completed"
    ).scalar() or 0
    if exp_completed >= 1:
        r = unlock_achievement(db, user_id, "experiment_completed")
        if r:
            new_codes.append(r)

    total_points = _get_total_points(db, user_id)
    if total_points >= 100:
        r = unlock_achievement(db, user_id, "hundred_points")
        if r:
            new_codes.append(r)

    best_streak = _calc_best_streak(db, user_id)
    if best_streak >= 7:
        r = unlock_achievement(db, user_id, "streak_7")
        if r:
            new_codes.append(r)

    balanced = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == user_id,
        DailyCheckin.sleep_hours.isnot(None),
        DailyCheckin.water_liters.isnot(None),
        DailyCheckin.mood.isnot(None),
        DailyCheckin.energy.isnot(None),
    ).all()
    for checkin in balanced:
        has_habit = db.query(HabitLog).filter(
            HabitLog.user_id == user_id,
            HabitLog.log_date == checkin.checkin_date,
            HabitLog.completed.is_(True),
        ).first()
        if has_habit:
            r = unlock_achievement(db, user_id, "balanced_day")
            if r:
                new_codes.append(r)
            break

    return new_codes


@router.get("/progress", response_model=UserProgressOut)
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_points = _get_total_points(db, current_user.id)
    level_info = calc_level(total_points)
    checkin_count = db.query(func.count(DailyCheckin.id)).filter(DailyCheckin.user_id == current_user.id).scalar() or 0
    habits_completed = db.query(func.count(HabitLog.id)).filter(HabitLog.user_id == current_user.id, HabitLog.completed.is_(True)).scalar() or 0
    experiments_completed = db.query(func.count(Experiment.id)).filter(Experiment.user_id == current_user.id, Experiment.status == "completed").scalar() or 0
    achievements_count = db.query(func.count(Achievement.id)).filter(Achievement.user_id == current_user.id).scalar() or 0
    return UserProgressOut(
        **level_info,
        total_checkins=checkin_count,
        total_habits_completed=habits_completed,
        total_experiments_completed=experiments_completed,
        total_achievements=achievements_count,
    )


@router.get("/achievements", response_model=AchievementsListOut)
def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unlocked = db.query(Achievement).filter(Achievement.user_id == current_user.id).order_by(Achievement.unlocked_at).all()
    unlocked_codes = {a.code for a in unlocked}
    available = [
        AchievementDefinition(code=d["code"], title=d["title"], description=d["description"], icon=d["icon"], category=d["category"], unlocked=False)
        for d in ACHIEVEMENT_DEFS if d["code"] not in unlocked_codes
    ]
    return AchievementsListOut(
        unlocked=[AchievementOut.model_validate(a) for a in unlocked],
        available=available,
    )


@router.post("/recalculate", response_model=RecalculateOut)
def recalculate(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_codes = recalculate_achievements(db, current_user.id)
    db.commit()
    total = db.query(func.count(Achievement.id)).filter(Achievement.user_id == current_user.id).scalar() or 0
    return RecalculateOut(new_achievements=new_codes, total_achievements=total)
