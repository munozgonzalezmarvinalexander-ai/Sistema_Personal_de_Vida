from datetime import datetime

from pydantic import BaseModel, Field


class ReminderSettingsUpdate(BaseModel):
    daily_checkin_enabled: bool | None = None
    daily_checkin_time: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    evening_shutdown_enabled: bool | None = None
    evening_shutdown_time: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    weekly_review_enabled: bool | None = None
    weekly_review_day: str | None = None
    weekly_review_time: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
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
