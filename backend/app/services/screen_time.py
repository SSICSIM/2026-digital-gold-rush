from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.crisis_note import Character
from app.models.screen_time import ScreenTimeEvent
from app.schemas import ScreenTimeBar, ScreenTimeLastChange, ScreenTimeSnapshot

# Every company starts the committee with this many hours of screen time.
STARTING_HOURS = 10.0


def build_snapshot(db: Session, period_id: int) -> ScreenTimeSnapshot:
    """Derive each company's current bar from the event log for a period."""
    characters = db.query(Character).order_by(Character.name).all()
    events = (
        db.query(ScreenTimeEvent)
        .filter(
            ScreenTimeEvent.period_id == period_id,
            ScreenTimeEvent.reverted_at.is_(None),
        )
        .order_by(ScreenTimeEvent.created_at, ScreenTimeEvent.id)
        .all()
    )

    by_character: dict[int, list[ScreenTimeEvent]] = defaultdict(list)
    for ev in events:
        by_character[ev.character_id].append(ev)

    bars: list[ScreenTimeBar] = []
    for ch in characters:
        evs = by_character.get(ch.id, [])
        current = round(STARTING_HOURS + sum(e.delta for e in evs), 2)
        if evs:
            last = evs[-1]
            previous = round(current - last.delta, 2)
            last_change = ScreenTimeLastChange(
                event_id=last.id,
                delta=last.delta,
                action_type=last.action_type,
                changed_at=last.created_at,
            )
        else:
            previous = current
            last_change = None
        bars.append(
            ScreenTimeBar(
                character_id=ch.id,
                name=ch.name,
                current=current,
                previous=previous,
                last_change=last_change,
            )
        )

    return ScreenTimeSnapshot(
        period_id=period_id,
        starting_hours=STARTING_HOURS,
        generated_at=datetime.now(timezone.utc),
        bars=bars,
    )
