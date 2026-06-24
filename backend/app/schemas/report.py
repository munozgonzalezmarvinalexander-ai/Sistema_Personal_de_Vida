from pydantic import BaseModel


class HabitReport(BaseModel):
    habit_id: str
    name: str
    category: str
    days_completed: int
    total_points: int


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
