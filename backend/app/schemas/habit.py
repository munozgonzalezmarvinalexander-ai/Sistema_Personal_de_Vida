from datetime import datetime

from pydantic import BaseModel


class HabitCreate(BaseModel):
    name: str
    category: str
    level_min: str
    level_normal: str
    level_ideal: str
    is_core: bool = False


class HabitUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    level_min: str | None = None
    level_normal: str | None = None
    level_ideal: str | None = None
    is_core: bool | None = None
    active: bool | None = None


class HabitOut(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    level_min: str
    level_normal: str
    level_ideal: str
    is_core: bool
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
