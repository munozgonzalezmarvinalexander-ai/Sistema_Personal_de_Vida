import uuid
from datetime import date, datetime, timezone

from sqlalchemy import String, Boolean, Integer, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class HabitLog(Base):
    __tablename__ = "habit_logs"
    __table_args__ = (UniqueConstraint("user_id", "habit_id", "log_date", name="uq_habit_log_user_habit_date"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    habit_id: Mapped[str] = mapped_column(String(36), ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    level_done: Mapped[str | None] = mapped_column(String(10), nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    points: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="habit_logs")
    habit = relationship("Habit", back_populates="logs")
