"""add_screen_time_events

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-10-04 12:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "screen_time_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "character_id",
            sa.Integer(),
            sa.ForeignKey("characters.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "period_id",
            sa.Integer(),
            sa.ForeignKey("crisis_periods.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "crisis_note_id",
            sa.Integer(),
            sa.ForeignKey("crisis_notes.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "action_type",
            sa.Enum(
                "LOBBYING",
                "CARTEL",
                "RESEARCH",
                "ROCKET_DOCKET",
                "OTHER",
                name="screen_time_action_enum",
            ),
            nullable=False,
        ),
        sa.Column("delta", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column("reverted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("delta <> 0", name="ck_screen_time_events_delta_nonzero"),
    )
    op.create_index(
        "ix_screen_time_events_period_character",
        "screen_time_events",
        ["period_id", "character_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_screen_time_events_period_character", table_name="screen_time_events")
    op.drop_table("screen_time_events")
    op.execute("DROP TYPE IF EXISTS screen_time_action_enum")
