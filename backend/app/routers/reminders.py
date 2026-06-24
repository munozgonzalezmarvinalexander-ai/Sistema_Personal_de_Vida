from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.reminder_settings import ReminderSettings
from app.models.user import User
from app.schemas.reminder import ReminderSettingsUpdate, ReminderSettingsOut

router = APIRouter(prefix="/reminders", tags=["reminders"])


def _get_or_create(db: Session, user_id: str) -> ReminderSettings:
    settings = db.query(ReminderSettings).filter(
        ReminderSettings.user_id == user_id
    ).first()
    if not settings:
        settings = ReminderSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/settings", response_model=ReminderSettingsOut)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_or_create(db, current_user.id)


@router.put("/settings", response_model=ReminderSettingsOut)
def update_settings(
    data: ReminderSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = _get_or_create(db, current_user.id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
