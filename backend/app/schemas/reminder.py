from datetime import datetime

from typing import Literal

from pydantic import BaseModel, Field, field_validator


TIME_PATTERN = r"^(?:[01]\d|2[0-3]):[0-5]\d$"
REMINDER_FIELDS = (
    "daily_checkin_enabled", "daily_checkin_time", "evening_shutdown_enabled",
    "evening_shutdown_time", "weekly_review_enabled", "weekly_review_day",
    "weekly_review_time", "habit_nudge_enabled",
)


def _reject_null(value):
    if value is None:
        raise ValueError("El valor no puede ser nulo")
    return value


class ReminderSettingsUpdate(BaseModel):
    daily_checkin_enabled: bool | None = None
    daily_checkin_time: str | None = Field(None, pattern=TIME_PATTERN)
    evening_shutdown_enabled: bool | None = None
    evening_shutdown_time: str | None = Field(None, pattern=TIME_PATTERN)
    weekly_review_enabled: bool | None = None
    weekly_review_day: Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] | None = None
    weekly_review_time: str | None = Field(None, pattern=TIME_PATTERN)
    habit_nudge_enabled: bool | None = None

    _required_when_present = field_validator(*REMINDER_FIELDS, mode="before")(_reject_null)


class ReminderSettingsOut(BaseModel):
    id: str
    user_id: str
    daily_checkin_enabled: bool
    daily_checkin_time: str
    evening_shutdown_enabled: bool
    evening_shutdown_time: str
    weekly_review_enabled: bool
    weekly_review_day: str
    weekly_review_time: str
    habit_nudge_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
