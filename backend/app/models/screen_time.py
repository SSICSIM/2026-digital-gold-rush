from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Index, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.crisis_note import Character, CrisisNote, CrisisPeriod


class ScreenTimeAction(str, enum.Enum):
    """What caused a screen-time change. Mirrors the Action dropdown in the
    Figma Update panel and is shown in the chart's hover tooltip."""

    LOBBYING = "LOBBYING"
    CARTEL = "CARTEL"
    RESEARCH = "RESEARCH"
    ROCKET_DOCKET = "ROCKET_DOCKET"
    OTHER = "OTHER"


class ScreenTimeEvent(Base):
    """One signed change to a company's screen time (hours).

    A company's current screen time is the starting value plus the sum of its
    non-reverted events, so the chart is always derived from this log rather
    than stored as a mutable number. Reversals are soft (reverted_at) so the
    history stays auditable.
    """

    __tablename__ = "screen_time_events"
    __table_args__ = (
        CheckConstraint("delta <> 0", name="ck_screen_time_events_delta_nonzero"),
        Index("ix_screen_time_events_period_character", "period_id", "character_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    character_id: Mapped[int] = mapped_column(
        ForeignKey("characters.id", ondelete="CASCADE"), nullable=False
    )
    period_id: Mapped[int] = mapped_column(
        ForeignKey("crisis_periods.id", ondelete="RESTRICT"), nullable=False
    )
    # Every action must be backed by a crisis note (per the PDR).
    crisis_note_id: Mapped[int] = mapped_column(
        ForeignKey("crisis_notes.id", ondelete="CASCADE"), nullable=False
    )
    action_type: Mapped[ScreenTimeAction] = mapped_column(
        SAEnum(ScreenTimeAction, name="screen_time_action_enum"), nullable=False
    )
    # Signed change in hours: positive = increase (green), negative = decrease (red).
    delta: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    reverted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    character: Mapped[Character] = relationship("Character")
    period: Mapped[CrisisPeriod] = relationship("CrisisPeriod")
    crisis_note: Mapped[CrisisNote] = relationship("CrisisNote")
