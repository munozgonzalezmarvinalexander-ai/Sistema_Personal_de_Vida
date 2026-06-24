from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel


class LevelDone(str, Enum):
    none = "none"
    min = "min"
    normal = "normal"
    ideal = "ideal"


LEVEL_POINTS = {"none": 0, "min": 1, "normal": 2, "ideal": 3}


class HabitLogCreate(BaseModel):
    habit_id: str
    log_date: date
    level_done: LevelDone = LevelDone.none


class HabitLogUpdate(BaseModel):
    level_done: LevelDone


class HabitLogOut(BaseModel):
    id: str
    user_id: str
    habit_id: str
    log_date: date
    level_done: str | None
    completed: bool
    points: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
