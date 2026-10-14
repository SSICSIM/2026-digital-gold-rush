from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.crisis_note import NoteType, Priority
from app.models.screen_time import ScreenTimeAction


class HealthResponse(BaseModel):
    status: str = "ok"


# ── Characters ──────────────────────────────────────────────────────────────

class CharacterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class CharacterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime


# ── Crisis Periods ───────────────────────────────────────────────────────────

class CrisisPeriodCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class CrisisPeriodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_active: bool
    created_at: datetime
    archived_at: datetime | None


# ── Crisis Notes ─────────────────────────────────────────────────────────────

class CrisisNoteCreate(BaseModel):
    character_id: int
    # Optional: lets the client assert which period it expects the note to
    # land in, so create_note can reject a stale submission (see there) if
    # the active period has since changed. Omit to just use whatever period
    # is currently active.
    period_id: int | None = None
    title: str = Field(min_length=1, max_length=512)
    description: str = Field(min_length=1)
    crisis_staff_notes: str | None = None
    priority: Priority
    note_type: NoteType


class CrisisNoteUpdate(BaseModel):
    character_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=512)
    description: str | None = Field(default=None, min_length=1)
    crisis_staff_notes: str | None = None
    priority: Priority | None = None
    note_type: NoteType | None = None


class CrisisNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    period_id: int
    character: CharacterResponse
    title: str
    description: str
    crisis_staff_notes: str | None
    priority: Priority
    note_type: NoteType
    created_at: datetime


# ── Staff Notes ───────────────────────────────────────────────────────────────

class StaffNoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    content: str = Field(min_length=1)


class StaffNoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    content: str | None = Field(default=None, min_length=1)


class StaffNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    period_id: int
    title: str
    content: str
    created_at: datetime


# ── Bulk upload ──────────────────────────────────────────────────────────────

class BulkUploadResult(BaseModel):
    created: int
    skipped: int


# ── Analytics ────────────────────────────────────────────────────────────────

class NotesByCharacter(BaseModel):
    character_name: str
    count: int


class PriorityCount(BaseModel):
    priority: Priority
    count: int


class AnalyticsSummary(BaseModel):
    total_notes: int
    notes_by_character: list[NotesByCharacter]
    priority_distribution: list[PriorityCount]
    private_directive_count: int
    public_directive_count: int


# ── Screen Time ──────────────────────────────────────────────────────────────

class ScreenTimeEventCreate(BaseModel):
    # One action can affect several companies (the Update panel's "Affected
    # Delegates" is multi-select); one event row is created per company.
    character_ids: list[int] = Field(min_length=1)
    crisis_note_id: int | None = None  # optional for now
    action_type: ScreenTimeAction
    # Signed hours: positive = increase, negative = decrease. Never zero.
    delta: float

    @field_validator("delta")
    @classmethod
    def _delta_nonzero(cls, v: float) -> float:
        if v == 0:
            raise ValueError("delta must not be zero")
        return v


class ScreenTimeEventUpdate(BaseModel):
    action_type: ScreenTimeAction | None = None
    delta: float | None = None

    @field_validator("delta")
    @classmethod
    def _delta_nonzero(cls, v: float | None) -> float | None:
        if v is not None and v == 0:
            raise ValueError("delta must not be zero")
        return v


class ScreenTimeEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    character_id: int
    period_id: int
    crisis_note_id: int | None
    action_type: ScreenTimeAction
    delta: float
    created_at: datetime
    reverted_at: datetime | None


class ScreenTimeLastChange(BaseModel):
    event_id: int
    delta: float
    action_type: ScreenTimeAction
    changed_at: datetime


class ScreenTimeBar(BaseModel):
    character_id: int
    name: str
    # Current screen time in hours (starting value + all live events).
    current: float
    # Value before the most recent live event (== current if there is none).
    # The chart draws min(previous, current) in blue and the difference as a
    # green (increase) or red (decrease) cap while the change is still recent.
    previous: float
    last_change: ScreenTimeLastChange | None


class ScreenTimeSnapshot(BaseModel):
    period_id: int
    starting_hours: float
    generated_at: datetime
    bars: list[ScreenTimeBar]
