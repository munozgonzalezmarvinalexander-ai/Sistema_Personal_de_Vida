import uuid
from datetime import date, datetime, timezone

from sqlalchemy import String, Integer, SmallInteger, Numeric, Date, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DailyCheckin(Base):
    __tablename__ = "daily_checkins"
    __table_args__ = (UniqueConstraint("user_id", "checkin_date", name="uq_checkin_user_date"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    checkin_date: Mapped[date] = mapped_column(Date, nullable=False)
    sleep_hours: Mapped[float | None] = mapped_column(Numeric(3, 1), nullable=True)
    sleep_quality: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    water_liters: Mapped[float | None] = mapped_column(Numeric(3, 1), nullable=True)
    mood: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    energy: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    food_quality: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    screen_hours: Mapped[float | None] = mapped_column(Numeric(3, 1), nullable=True)
    spending: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    university_study_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    english_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    programming_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reading_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    meditation_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=0)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="daily_checkins")
