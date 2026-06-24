from datetime import date, datetime

from pydantic import BaseModel, Field


class DailyCheckinCreate(BaseModel):
    checkin_date: date
    sleep_hours: float | None = Field(None, ge=0, le=24)
    sleep_quality: int | None = Field(None, ge=1, le=5)
    water_liters: float | None = Field(None, ge=0, le=15)
    mood: int | None = Field(None, ge=1, le=5)
    energy: int | None = Field(None, ge=1, le=5)
    food_quality: int | None = Field(None, ge=1, le=5)
    screen_hours: float | None = Field(None, ge=0, le=24)
    spending: float | None = Field(None, ge=0)
    university_study_minutes: int | None = Field(None, ge=0)
    english_minutes: int | None = Field(None, ge=0)
    programming_minutes: int | None = Field(None, ge=0)
    reading_minutes: int | None = Field(None, ge=0)
    meditation_minutes: int | None = Field(None, ge=0)
    note: str | None = None


class DailyCheckinUpdate(BaseModel):
    sleep_hours: float | None = Field(None, ge=0, le=24)
    sleep_quality: int | None = Field(None, ge=1, le=5)
    water_liters: float | None = Field(None, ge=0, le=15)
    mood: int | None = Field(None, ge=1, le=5)
    energy: int | None = Field(None, ge=1, le=5)
    food_quality: int | None = Field(None, ge=1, le=5)
    screen_hours: float | None = Field(None, ge=0, le=24)
    spending: float | None = Field(None, ge=0)
    university_study_minutes: int | None = Field(None, ge=0)
    english_minutes: int | None = Field(None, ge=0)
    programming_minutes: int | None = Field(None, ge=0)
    reading_minutes: int | None = Field(None, ge=0)
    meditation_minutes: int | None = Field(None, ge=0)
    note: str | None = None


class DailyCheckinOut(BaseModel):
    id: str
    user_id: str
    checkin_date: date
    sleep_hours: float | None
    sleep_quality: int | None
    water_liters: float | None
    mood: int | None
    energy: int | None
    food_quality: int | None
    screen_hours: float | None
    spending: float | None
    university_study_minutes: int | None
    english_minutes: int | None
    programming_minutes: int | None
    reading_minutes: int | None
    meditation_minutes: int | None
    points: int
    note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
