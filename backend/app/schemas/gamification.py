from datetime import datetime

from pydantic import BaseModel


LEVEL_THRESHOLDS = [0, 50, 120, 220, 350, 520, 730, 980, 1260, 1600]


def calc_level(total_points: int) -> dict:
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if total_points >= threshold:
            level = i + 1
    current_threshold = LEVEL_THRESHOLDS[level - 1]
    if level < len(LEVEL_THRESHOLDS):
        next_threshold = LEVEL_THRESHOLDS[level]
        points_in_level = total_points - current_threshold
        points_needed = next_threshold - current_threshold
        progress_pct = round((points_in_level / points_needed) * 100)
    else:
        next_threshold = current_threshold
        points_in_level = 0
        points_needed = 0
        progress_pct = 100
    return {
        "level": level,
        "total_points": total_points,
        "current_threshold": current_threshold,
        "next_threshold": next_threshold,
        "points_in_level": points_in_level,
        "points_needed": points_needed,
        "progress_pct": progress_pct,
    }


class AchievementOut(BaseModel):
    id: str
    code: str
    title: str
    description: str
    icon: str
    category: str
    unlocked_at: datetime

    model_config = {"from_attributes": True}


class AchievementDefinition(BaseModel):
    code: str
    title: str
    description: str
    icon: str
    category: str
    unlocked: bool


class UserProgressOut(BaseModel):
    level: int
    total_points: int
    current_threshold: int
    next_threshold: int
    points_in_level: int
    points_needed: int
    progress_pct: int
    total_checkins: int
    total_habits_completed: int
    total_experiments_completed: int
    total_achievements: int


class AchievementsListOut(BaseModel):
    unlocked: list[AchievementOut]
    available: list[AchievementDefinition]


class RecalculateOut(BaseModel):
    new_achievements: list[str]
    total_achievements: int
