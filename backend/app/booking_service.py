"""In-memory booking sessions: HR webhook → sales slots → lead picks time on /book/:token."""

from __future__ import annotations

import secrets
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class BookingSession:
    token: str
    lead_id: str
    email: str | None
    full_name: str | None
    company: str | None
    phone: str | None
    available_slots: list[str] = field(default_factory=list)
    selected_slot: str | None = None
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)
    raw_webhook: dict[str, Any] = field(default_factory=dict)


_sessions_by_token: dict[str, BookingSession] = {}
_lead_id_to_token: dict[str, str] = {}


def _pick_lead_id(payload: dict[str, Any]) -> str | None:
    for key in ("lead_id", "leadId", "id", "customer_id", "customerId"):
        v = payload.get(key)
        if v is not None and str(v).strip():
            return str(v).strip()
    return None


def upsert_session_from_webhook(payload: dict[str, Any]) -> BookingSession:
    lead_id = _pick_lead_id(payload)
    if not lead_id:
        raise ValueError("Missing lead id (expected lead_id, id, or customer_id)")

    token = _lead_id_to_token.get(lead_id)
    if not token:
        token = secrets.token_urlsafe(24)
        _lead_id_to_token[lead_id] = token

    existing = _sessions_by_token.get(token)
    now = _utcnow()
    email = payload.get("email") or payload.get("Email")
    full_name = (
        payload.get("full_name")
        or payload.get("fullName")
        or payload.get("name")
        or payload.get("Name")
    )
    company = payload.get("company") or payload.get("Company")
    phone = payload.get("phone") or payload.get("Phone")

    if existing:
        existing.email = str(email).strip() if email else existing.email
        existing.full_name = str(full_name).strip() if full_name else existing.full_name
        existing.company = str(company).strip() if company else existing.company
        existing.phone = str(phone).strip() if phone else existing.phone
        existing.raw_webhook = {**existing.raw_webhook, **payload}
        existing.updated_at = now
        return existing

    session = BookingSession(
        token=token,
        lead_id=lead_id,
        email=str(email).strip() if email else None,
        full_name=str(full_name).strip() if full_name else None,
        company=str(company).strip() if company else None,
        phone=str(phone).strip() if phone else None,
        raw_webhook=dict(payload),
        created_at=now,
        updated_at=now,
    )
    _sessions_by_token[token] = session
    return session


def get_session(token: str) -> BookingSession | None:
    return _sessions_by_token.get(token.strip())


def set_available_slots(lead_id: str, slots: list[str]) -> BookingSession | None:
    tid = _lead_id_to_token.get(lead_id.strip())
    if not tid:
        return None
    s = _sessions_by_token.get(tid)
    if not s:
        return None
    s.available_slots = [x.strip() for x in slots if x and str(x).strip()]
    s.updated_at = _utcnow()
    return s


def confirm_slot(token: str, slot_iso: str, *, allow_any: bool = False) -> BookingSession | None:
    s = get_session(token)
    if not s:
        return None
    slot = slot_iso.strip()
    if not allow_any and slot not in s.available_slots:
        return None
    s.selected_slot = slot
    s.updated_at = _utcnow()
    return s


# --- Pydantic payloads for OpenAPI ---


class PublishSlotsBody(BaseModel):
    lead_id: str = Field(..., description="Same id as webhook lead")
    available_slots: list[str] = Field(
        ...,
        description="ISO 8601 start times sales is offering",
        min_length=1,
    )


class ConfirmBookingBody(BaseModel):
    """In-memory list: set slot_start only. Twin rows: set slot_id (+ optional product_id, meeting_name)."""

    slot_start: str = ""
    slot_id: int | str | None = None
    product_id: int | str | None = None
    meeting_name: str | None = None


class OutboundNotifyPayload(BaseModel):
    event: str
    lead_id: str
    email: str | None = None
    full_name: str | None = None
    available_slots: list[str] = Field(default_factory=list)
    booking_url: str
    booking_token: str


class BookingConfirmedPayload(BaseModel):
    event: str = "booking_confirmed"
    lead_id: str
    email: str | None = None
    selected_slot: str
    booking_token: str
