from datetime import datetime

from typing import Literal

from pydantic import BaseModel, Field


TIME_PATTERN = r"^(?:[01]\d|2[0-3]):[0-5]\d$"


class ReminderSettingsUpdate(BaseModel):
    daily_checkin_enabled: bool | None = None
    daily_checkin_time: str | None = Field(None, pattern=TIME_PATTERN)
    evening_shutdown_enabled: bool | None = None
    evening_shutdown_time: str | None = Field(None, pattern=TIME_PATTERN)
    weekly_review_enabled: bool | None = None
    weekly_review_day: Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] | None = None
    weekly_review_time: str | None = Field(None, pattern=TIME_PATTERN)
    habit_nudge_enabled: bool | None = None


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
