"""initial tables

Revision ID: edf354178d95
Revises:
Create Date: 2026-06-24 10:38:08.023449
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "edf354178d95"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_table(
        "daily_checkins",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("checkin_date", sa.Date(), nullable=False),
        sa.Column("sleep_hours", sa.Numeric(precision=3, scale=1), nullable=True),
        sa.Column("sleep_quality", sa.SmallInteger(), nullable=True),
        sa.Column("water_liters", sa.Numeric(precision=3, scale=1), nullable=True),
        sa.Column("mood", sa.SmallInteger(), nullable=True),
        sa.Column("energy", sa.SmallInteger(), nullable=True),
        sa.Column("food_quality", sa.SmallInteger(), nullable=True),
        sa.Column("screen_hours", sa.Numeric(precision=3, scale=1), nullable=True),
        sa.Column("spending", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("university_study_minutes", sa.Integer(), nullable=True),
        sa.Column("english_minutes", sa.Integer(), nullable=True),
        sa.Column("programming_minutes", sa.Integer(), nullable=True),
        sa.Column("reading_minutes", sa.Integer(), nullable=True),
        sa.Column("meditation_minutes", sa.Integer(), nullable=True),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "checkin_date", name="uq_checkin_user_date"),
    )
    op.create_table(
        "habits",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("level_min", sa.Text(), nullable=False),
        sa.Column("level_normal", sa.Text(), nullable=False),
        sa.Column("level_ideal", sa.Text(), nullable=False),
        sa.Column("is_core", sa.Boolean(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "habit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("habit_id", sa.String(length=36), nullable=False),
        sa.Column("log_date", sa.Date(), nullable=False),
        sa.Column("level_done", sa.String(length=10), nullable=True),
        sa.Column("completed", sa.Boolean(), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["habit_id"], ["habits.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "habit_id", "log_date", name="uq_habit_log_user_habit_date"),
    )


def downgrade() -> None:
    op.drop_table("habit_logs")
    op.drop_table("habits")
    op.drop_table("daily_checkins")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
