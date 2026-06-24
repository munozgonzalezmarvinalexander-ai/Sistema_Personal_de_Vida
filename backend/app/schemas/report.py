from pydantic import BaseModel


class HabitReport(BaseModel):
    habit_id: str
    name: str
    category: str
    days_completed: int
    total_points: int


class ComparisonValue(BaseModel):
    current: float | int | None
    previous: float | int | None
    direction: str


class WeeklyReport(BaseModel):
    start_date: str
    end_date: str
    total_points: int
    days_logged: int
    avg_sleep: float | None
    avg_mood: float | None
    avg_energy: float | None
    total_study_minutes: int
    total_english_minutes: int
    total_programming_minutes: int
    total_reading_minutes: int
    total_meditation_minutes: int
    habits_most_completed: list[HabitReport]
    habits_least_completed: list[HabitReport]
    comparison: dict[str, ComparisonValue] | None = None


class TrendDay(BaseModel):
    date: str
    points: int
    sleep_hours: float | None
    mood: int | None
    energy: int | None
    water_liters: float | None
    university_study_minutes: int
    english_minutes: int
    programming_minutes: int
    reading_minutes: int
    meditation_minutes: int


class TrendsResponse(BaseModel):
    days: int
    data: list[TrendDay]


class StreakResponse(BaseModel):
    current_streak: int
    best_streak: int
    grace_days_used_this_week: int
    total_active_days: int
    total_days_checked: int
