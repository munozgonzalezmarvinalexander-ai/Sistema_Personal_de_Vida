import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReminderSettings(Base):
    __tablename__ = "reminder_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    daily_checkin_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    daily_checkin_time: Mapped[str] = mapped_column(String(5), default="20:30")
    evening_shutdown_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    evening_shutdown_time: Mapped[str] = mapped_column(String(5), default="21:30")
    weekly_review_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    weekly_review_day: Mapped[str] = mapped_column(String(10), default="sunday")
    weekly_review_time: Mapped[str] = mapped_column(String(5), default="18:00")
    habit_nudge_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="reminder_settings")
