from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.crisis_note import Character, CrisisNote, CrisisPeriod
from app.models.screen_time import ScreenTimeEvent
from app.schemas import (
    ScreenTimeEventCreate,
    ScreenTimeEventResponse,
    ScreenTimeEventUpdate,
    ScreenTimeSnapshot,
)
from app.services.screen_time import build_snapshot

router = APIRouter(prefix="/screen-time", tags=["screen-time"])


def _active_period(db: Session) -> CrisisPeriod:
    period = db.query(CrisisPeriod).filter(CrisisPeriod.is_active.is_(True)).first()
    if not period:
        raise HTTPException(status_code=422, detail="No active period. Create a period first.")
    return period


@router.get("/snapshot", response_model=ScreenTimeSnapshot)
def get_snapshot(db: Session = Depends(get_db)) -> ScreenTimeSnapshot:
    # Cumulative across all periods; archiving a period does not reset the chart.
    return build_snapshot(db, _active_period(db).id)


@router.get("/events", response_model=list[ScreenTimeEventResponse])
def list_events(
    period_id: int | None = Query(None),
    character_id: int | None = Query(None),
    include_reverted: bool = Query(False),
    db: Session = Depends(get_db),
) -> list[ScreenTimeEvent]:
    query = db.query(ScreenTimeEvent)
    if period_id is not None:
        query = query.filter(ScreenTimeEvent.period_id == period_id)
    if character_id is not None:
        query = query.filter(ScreenTimeEvent.character_id == character_id)
    if not include_reverted:
        query = query.filter(ScreenTimeEvent.reverted_at.is_(None))
    return query.order_by(ScreenTimeEvent.created_at.desc(), ScreenTimeEvent.id.desc()).all()


@router.post(
    "/events",
    response_model=list[ScreenTimeEventResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_events(
    body: ScreenTimeEventCreate, db: Session = Depends(get_db)
) -> list[ScreenTimeEvent]:
    period = _active_period(db)

    # The note is optional; if one is supplied it must exist and belong to the
    # active period.
    note_id: int | None = None
    if body.crisis_note_id is not None:
        note = db.get(CrisisNote, body.crisis_note_id)
        if not note:
            raise HTTPException(status_code=404, detail="Crisis note not found.")
        if note.period_id != period.id:
            raise HTTPException(
                status_code=422,
                detail="That crisis note belongs to a different period than the active one.",
            )
        note_id = note.id

    character_ids = list(dict.fromkeys(body.character_ids))  # dedupe, keep order
    found = {
        c.id for c in db.query(Character.id).filter(Character.id.in_(character_ids)).all()
    }
    missing = [cid for cid in character_ids if cid not in found]
    if missing:
        raise HTTPException(status_code=404, detail=f"Character not found: {missing}")

    events = [
        ScreenTimeEvent(
            character_id=cid,
            period_id=period.id,
            crisis_note_id=note_id,
            action_type=body.action_type,
            delta=body.delta,
        )
        for cid in character_ids
    ]
    db.add_all(events)
    db.commit()
    for ev in events:
        db.refresh(ev)
    return events


@router.patch("/events/{event_id}", response_model=ScreenTimeEventResponse)
def update_event(
    event_id: int, body: ScreenTimeEventUpdate, db: Session = Depends(get_db)
) -> ScreenTimeEvent:
    event = db.get(ScreenTimeEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    if event.reverted_at is not None:
        raise HTTPException(status_code=409, detail="This event was reverted and can't be edited.")
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.post("/events/{event_id}/revert", response_model=ScreenTimeEventResponse)
def revert_event(event_id: int, db: Session = Depends(get_db)) -> ScreenTimeEvent:
    event = db.get(ScreenTimeEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    if event.reverted_at is not None:
        raise HTTPException(status_code=409, detail="This event is already reverted.")
    event.reverted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(event)
    return event
