from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class Difficulty(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class EvidenceType(str, Enum):
    science = "science"
    tradition = "tradition"
    personal = "personal"


class HabitLibraryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    category: str = Field(..., min_length=1, max_length=50)
    description: str = Field(..., min_length=1)
    benefit: str = Field(..., min_length=1)
    how_to_start: str = Field(..., min_length=1)
    difficulty: Difficulty
    daily_minutes: int = Field(..., ge=1, le=480)
    evidence_type: EvidenceType
    source: str | None = None
    warning: str | None = None


class HabitLibraryUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    description: str | None = None
    benefit: str | None = None
    how_to_start: str | None = None
    difficulty: Difficulty | None = None
    daily_minutes: int | None = Field(None, ge=1, le=480)
    evidence_type: EvidenceType | None = None
    source: str | None = None
    warning: str | None = None
    active: bool | None = None


class HabitLibraryOut(BaseModel):
    id: str
    name: str
    category: str
    description: str
    benefit: str
    how_to_start: str
    difficulty: str
    daily_minutes: int
    evidence_type: str
    source: str | None
    warning: str | None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
