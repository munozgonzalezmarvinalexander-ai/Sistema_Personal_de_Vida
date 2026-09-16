"""Recalculate daily check-in points from habit logs.

Revision ID: c7d14a9206b1
Revises: 33741bfabdf6
"""

from collections.abc import Sequence

from alembic import op


revision: str = "c7d14a9206b1"
down_revision: str | None = "33741bfabdf6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _recalculate() -> None:
    op.execute(
        """
        UPDATE daily_checkins
        SET points = COALESCE((
            SELECT SUM(habit_logs.points)
            FROM habit_logs
            WHERE habit_logs.user_id = daily_checkins.user_id
              AND habit_logs.log_date = daily_checkins.checkin_date
        ), 0)
        """
    )


def upgrade() -> None:
    _recalculate()


def downgrade() -> None:
    # Historical derived values cannot be reconstructed. Keep them internally
    # consistent if this data-only migration is downgraded.
    _recalculate()
