from datetime import datetime

from pydantic import BaseModel, Field, field_validator


TEXT_FIELDS = ("name", "category", "level_min", "level_normal", "level_ideal")


def _strip_required(value: str | None) -> str:
    if value is None:
        raise ValueError("El valor no puede ser nulo")
    value = value.strip()
    if not value:
        raise ValueError("El texto no puede estar vacio")
    return value


def _reject_null(value):
    if value is None:
        raise ValueError("El valor no puede ser nulo")
    return value


class HabitCreate(BaseModel):
    name: str = Field(..., max_length=100)
    category: str = Field(..., max_length=50)
    level_min: str = Field(..., max_length=500)
    level_normal: str = Field(..., max_length=500)
    level_ideal: str = Field(..., max_length=500)
    is_core: bool = False
    library_item_id: str | None = None

    _required_text = field_validator(*TEXT_FIELDS, mode="before")(_strip_required)


class HabitUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    category: str | None = Field(None, max_length=50)
    level_min: str | None = Field(None, max_length=500)
    level_normal: str | None = Field(None, max_length=500)
    level_ideal: str | None = Field(None, max_length=500)
    is_core: bool | None = None
    active: bool | None = None

    _required_text = field_validator(*TEXT_FIELDS, mode="before")(_strip_required)
    _required_flags = field_validator("is_core", "active", mode="before")(_reject_null)


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
