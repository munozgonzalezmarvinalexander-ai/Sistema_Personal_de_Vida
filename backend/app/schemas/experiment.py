from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


def _strip_required(value: str | None) -> str:
    if value is None:
        raise ValueError("El valor no puede ser nulo")
    value = value.strip()
    if not value:
        raise ValueError("El texto no puede estar vacio")
    return value


class DurationDays(int, Enum):
    seven = 7
    fourteen = 14
    thirty = 30


class DecisionType(str, Enum):
    adopt = "adopt"
    adjust = "adjust"
    discard = "discard"


class ExperimentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    hypothesis: str = Field(..., min_length=1)
    metric_tracked: str = Field(..., min_length=1, max_length=100)
    duration_days: DurationDays
    start_date: date
    library_item_id: str | None = None

    _required_text = field_validator("title", "hypothesis", "metric_tracked", mode="before")(_strip_required)


class ExperimentUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = None
    hypothesis: str | None = None
    metric_tracked: str | None = None

    _required_text = field_validator("title", "hypothesis", "metric_tracked", mode="before")(_strip_required)


class ExperimentComplete(BaseModel):
    result: str = Field(..., min_length=1)
    decision: DecisionType

    _required_result = field_validator("result", mode="before")(_strip_required)


class ExperimentOut(BaseModel):
    id: str
    user_id: str
    title: str
    description: str | None
    hypothesis: str
    metric_tracked: str
    duration_days: int
    start_date: date
    end_date: date
    status: str
    result: str | None
    decision: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
