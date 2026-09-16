from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.dates import today_local
from app.models.daily_checkin import DailyCheckin
from app.models.habit_log import HabitLog


@dataclass(frozen=True)
class StreakStats:
    current: int
    best: int
    grace_this_week: int
    active_days: int
    checked_days: int


def calculate_streaks(db: Session, user_id: str, end: date | None = None, window_days: int = 90) -> StreakStats:
    """An active day has a saved check-in or a completed habit; one missed day is tolerated."""
    end = end or today_local()
    start = end - timedelta(days=window_days - 1)
    checkin_dates = {row[0] for row in db.query(DailyCheckin.checkin_date).filter(
        DailyCheckin.user_id == user_id, DailyCheckin.checkin_date >= start, DailyCheckin.checkin_date <= end,
    ).all()}
    habit_dates = {row[0] for row in db.query(HabitLog.log_date).filter(
        HabitLog.user_id == user_id, HabitLog.log_date >= start, HabitLog.log_date <= end,
        HabitLog.completed.is_(True),
    ).distinct().all()}
    active = checkin_dates | habit_dates
    best = streak = misses = 0
    d = start
    while d <= end:
        if d in active:
            misses = 0
            streak += 1
        else:
            misses += 1
            if misses >= 2:
                best = max(best, streak)
                streak = misses = 0
        d += timedelta(days=1)
    best = max(best, streak)
    week_start = end - timedelta(days=end.weekday())
    grace = 0
    previous_active = True
    d = week_start
    while d <= end:
        if d not in active:
            if previous_active:
                grace += 1
            previous_active = False
        else:
            previous_active = True
        d += timedelta(days=1)
    return StreakStats(streak, best, grace, len(active), window_days)
