from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .booking_service import (
    BookingConfirmedPayload,
    ConfirmBookingBody,
    OutboundNotifyPayload,
    PublishSlotsBody,
    confirm_slot,
    get_session,
    set_available_slots,
    upsert_session_from_webhook,
)
from .config import settings
from .happyrobot_client import HappyRobotClient
from .schemas import (
    LeadCreate,
    ProductCreate,
    TableRowCreate,
    TableRowDelete,
    TableRowUpdate,
)

app = FastAPI(title=settings.app_name)
client = HappyRobotClient()

_DEV_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "http://localhost:8080",
]
_cors = settings.cors_origins.strip()
if _cors == "*":
    # Any SPA origin; browser does not send cookies to this API by default.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    _extra = [x.strip() for x in _cors.split(",") if x.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(dict.fromkeys(_DEV_ORIGINS + _extra)),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    )


def _to_http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, httpx.HTTPStatusError):
        response = exc.response
        detail: Any
        try:
            detail = response.json()
        except Exception:
            detail = response.text or "HappyRobot request failed"
        return HTTPException(status_code=response.status_code, detail=detail)
    if isinstance(exc, httpx.RequestError):
        return HTTPException(status_code=502, detail=str(exc))
    return HTTPException(status_code=500, detail=str(exc))


def _pick(row: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = row.get(key)
        if value is not None and value != "":
            return value
    return None


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": settings.app_name, "health": "/health", "docs": "/docs"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.app_env}


@app.get("/api/schema")
async def get_schema() -> Any:
    try:
        return await client.get_schema()
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.get("/api/tables/{table_name}")
async def get_table_data(table_name: str) -> Any:
    try:
        return await client.get_table_rows(table_name)
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.post("/api/tables/{table_name}/rows")
async def insert_table_row(table_name: str, payload: TableRowCreate) -> Any:
    try:
        return await client.insert_table_row(table_name, payload.values)
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.patch("/api/tables/{table_name}/rows")
async def update_table_row(table_name: str, payload: TableRowUpdate) -> Any:
    try:
        return await client.update_table_row(
            table_name,
            primary_key=payload.primaryKey,
            updates=payload.updates,
        )
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.delete("/api/tables/{table_name}/rows")
async def delete_table_rows(table_name: str, payload: TableRowDelete) -> Any:
    try:
        return await client.delete_table_rows(table_name, payload.rowKeys)
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.post("/api/sql")
async def execute_sql(payload: dict[str, str]) -> Any:
    sql = payload.get("sql", "").strip()
    if not sql:
        raise HTTPException(status_code=400, detail="sql is required")
    try:
        return await client.execute_sql(sql)
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.get("/api/products")
async def list_products() -> Any:
    try:
        return await client.get_table_rows("etac_products")
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.post("/api/products")
async def create_product(payload: ProductCreate) -> Any:
    try:
        values = payload.model_dump()
        # HappyRobot Twin insert schema expects string for this column.
        values["price"] = str(values["price"])
        return await client.insert_table_row("etac_products", values)
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.get("/api/leads")
async def list_leads() -> Any:
    try:
        return await client.get_table_rows("etac_leads")
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.post("/api/leads")
async def create_lead(payload: LeadCreate) -> Any:
    try:
        return await client.insert_table_row("etac_leads", payload.model_dump())
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.get("/api/transcripts")
async def list_transcripts_for_customer(customer_id: str) -> Any:
    """Rows from etac_transcript where customer_id matches the lead id."""
    cid = (customer_id or "").strip()
    if not cid:
        raise HTTPException(status_code=400, detail="customer_id is required")
    try:
        data = await client.get_table_rows("etac_transcript")
        rows = data.get("rows") or []

        def row_customer_id(row: dict[str, Any]) -> str:
            v = row.get("customer_id")
            if v is None:
                v = row.get("customerId")
            return str(v) if v is not None else ""

        filtered = [r for r in rows if row_customer_id(r) == cid]
        filtered.sort(
            key=lambda r: str(r.get("created_at") or r.get("createdAt") or "")
        )
        return {
            "tableName": "etac_transcript",
            "kind": "table",
            "rows": filtered,
            "total": len(filtered),
        }
    except Exception as exc:
        raise _to_http_error(exc) from exc


@app.get("/api/conversations/latest-assignment")
async def get_latest_conversation_assignment(lead_id: str) -> Any:
    """Latest etac_conversation row for a lead, sorted by follow_up_date."""
    lid = (lead_id or "").strip()
    if not lid:
        raise HTTPException(status_code=400, detail="lead_id is required")
    try:
        data = await client.get_table_rows("etac_conversation")
        rows = data.get("rows") or []

        def row_lead_id(row: dict[str, Any]) -> str:
            value = _pick(row, "lead_id", "leadId")
            return str(value) if value is not None else ""

        def row_follow_up_date(row: dict[str, Any]) -> str:
            value = _pick(row, "follow_up_date", "followUpDate")
            return str(value) if value is not None else ""

        matching = [row for row in rows if row_lead_id(row) == lid and row_follow_up_date(row)]
        matching.sort(key=row_follow_up_date)
        latest = matching[-1] if matching else None

        if not latest:
            return {
                "leadId": lid,
                "found": False,
                "assignedProductId": None,
                "followUpDate": None,
                "row": None,
            }

        return {
            "leadId": lid,
            "found": True,
            "assignedProductId": _pick(latest, "assigned_product_id", "assignedProductId"),
            "followUpDate": row_follow_up_date(latest),
            "row": latest,
        }
    except Exception as exc:
        raise _to_http_error(exc) from exc


def _public_booking_url(token: str) -> str:
    base = (settings.public_app_base_url or "").strip().rstrip("/")
    path = f"/book/{token}"
    if not base:
        return path
    return f"{base}{path}"


def _require_booking_webhook_secret(x_booking_webhook_secret: str | None) -> None:
    want = (settings.booking_webhook_secret or "").strip()
    if not want:
        return
    if (x_booking_webhook_secret or "").strip() != want:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Booking-Webhook-Secret")


def _require_booking_service_secret(x_booking_service_secret: str | None) -> None:
    want = (settings.booking_service_secret or "").strip()
    if not want:
        if settings.app_env == "dev":
            return
        raise HTTPException(status_code=503, detail="BOOKING_SERVICE_SECRET is not configured")
    if (x_booking_service_secret or "").strip() != want:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Booking-Service-Secret")


def _twin_row_id(row: dict[str, Any]) -> Any:
    return row.get("id") if row.get("id") is not None else row.get("Id")


def _sales_meeting_slots_response(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Shared sales availability pool: same rows for every lead (single rep hackathon)."""
    twin_slots: list[dict[str, Any]] = []
    for r in rows:
        sid = _twin_row_id(r)
        sa = r.get("starts_at") or r.get("startsAt")
        if sid is None or sa is None:
            continue
        ea = r.get("ends_at") or r.get("endsAt")
        twin_slots.append(
            {
                "id": sid,
                "starts_at": str(sa),
                "ends_at": str(ea) if ea is not None else None,
            }
        )
    return twin_slots


def _duration_minutes(start_iso: str, end_iso: str | None) -> int:
    if not end_iso:
        return 30
    try:
        from datetime import datetime

        s = str(start_iso).replace("Z", "+00:00")
        e = str(end_iso).replace("Z", "+00:00")
        a = datetime.fromisoformat(s)
        b = datetime.fromisoformat(e)
        return max(1, int((b - a).total_seconds() // 60))
    except Exception:
        return 30


def _coerce_int(v: Any) -> int | None:
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        return v
    try:
        return int(str(v).strip(), 10)
    except Exception:
        return None


async def _post_happyrobot_outbound(payload: dict[str, Any]) -> dict[str, Any]:
    url = (settings.happyrobot_outbound_webhook_url or "").strip()
    if not url:
        return {"notified": False, "reason": "happyrobot_outbound_webhook_url unset"}
    async with httpx.AsyncClient(timeout=settings.happyrobot_timeout_seconds) as ac:
        response = await ac.post(url, json=payload)
        response.raise_for_status()
    try:
        downstream: Any = response.json() if response.content else {}
    except Exception:
        downstream = {"raw": response.text}
    return {"notified": True, "downstream": downstream}


@app.post("/api/webhooks/happyrobot/lead")
async def happyrobot_lead_webhook(
    request: Request,
    x_booking_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    """HappyRobot POSTs lead payload; we create a booking session and return the public URL."""
    _require_booking_webhook_secret(x_booking_webhook_secret)
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Expected JSON body") from None
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Body must be a JSON object")
    try:
        session = upsert_session_from_webhook(body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    booking_url = _public_booking_url(session.token)
    return {
        "ok": True,
        "lead_id": session.lead_id,
        "booking_token": session.token,
        "booking_url": booking_url,
    }


@app.post("/api/booking/publish-slots")
async def booking_publish_slots(
    body: PublishSlotsBody,
    x_booking_service_secret: str | None = Header(None),
) -> dict[str, Any]:
    """Sales sets available times; we store them and POST to HappyRobot outbound webhook."""
    _require_booking_service_secret(x_booking_service_secret)
    session = set_available_slots(body.lead_id, body.available_slots)
    if not session:
        raise HTTPException(status_code=404, detail="Unknown lead_id — call the lead webhook first")
    booking_url = _public_booking_url(session.token)
    payload = OutboundNotifyPayload(
        event="availability_published",
        lead_id=session.lead_id,
        email=session.email,
        full_name=session.full_name,
        available_slots=session.available_slots,
        booking_url=booking_url,
        booking_token=session.token,
    )
    notify = await _post_happyrobot_outbound(payload.model_dump())
    return {
        "ok": True,
        "lead_id": session.lead_id,
        "booking_url": booking_url,
        "available_slots": session.available_slots,
        **notify,
    }


@app.get("/api/booking/sessions/{token}")
async def booking_get_session(token: str) -> dict[str, Any]:
    session = get_session(token)
    if not session:
        raise HTTPException(status_code=404, detail="Invalid or expired booking link")
    twin_slots: list[dict[str, Any]] = []
    try:
        data = await client.get_table_rows("etac_meeting_slots")
        rows = data.get("rows") or []
        twin_slots = _sales_meeting_slots_response(rows)
    except Exception:
        twin_slots = []
    return {
        "lead_id": session.lead_id,
        "display_name": session.full_name or "Guest",
        "email": session.email,
        "company": session.company,
        "available_slots": session.available_slots,
        "twin_slots": twin_slots,
        "selected_slot": session.selected_slot,
        "booking_confirmed": session.selected_slot is not None,
    }


@app.post("/api/booking/sessions/{token}/confirm")
async def booking_confirm(token: str, body: ConfirmBookingBody) -> dict[str, Any]:
    session = get_session(token)
    if not session:
        raise HTTPException(status_code=404, detail="Invalid or expired booking link")

    slot_iso: str
    if body.slot_id is not None:
        try:
            data = await client.get_table_rows("etac_meeting_slots")
        except Exception as exc:
            raise _to_http_error(exc) from exc
        rows = data.get("rows") or []
        match: dict[str, Any] | None = None
        for r in rows:
            if str(_twin_row_id(r)) != str(body.slot_id):
                continue
            match = r
            break
        if not match:
            raise HTTPException(status_code=400, detail="Invalid slot_id")
        sa = match.get("starts_at") or match.get("startsAt")
        if not sa:
            raise HTTPException(status_code=400, detail="Slot has no starts_at")
        slot_iso = str(sa).strip()
        ea = match.get("ends_at") or match.get("endsAt")
        duration = _duration_minutes(slot_iso, str(ea) if ea else None)
        lead_int = _coerce_int(session.lead_id)
        if lead_int is None:
            raise HTTPException(
                status_code=400,
                detail="lead_id must be numeric for etac_meetings.lead_id",
            )
        prod = _coerce_int(body.product_id) or _coerce_int(
            match.get("product_id") or match.get("productId")
        )
        name = (body.meeting_name or "").strip() or "Meeting"
        # Twin schema for this org expects string fields for numeric columns.
        values: dict[str, Any] = {
            "lead_id": str(lead_int),
            "name": name,
            "starts_at": slot_iso,
            "duration": str(duration),
        }
        if prod is not None:
            values["product_id"] = str(prod)
        try:
            await client.insert_table_row("etac_meetings", values)
            pk = _twin_row_id(match)
            await client.delete_table_rows("etac_meeting_slots", [{"id": pk}])
        except Exception as exc:
            raise _to_http_error(exc) from exc
        confirmed = confirm_slot(token, slot_iso, allow_any=True)
        if not confirmed:
            raise HTTPException(status_code=500, detail="Session update failed")
    else:
        slot_iso = body.slot_start.strip()
        if not slot_iso:
            raise HTTPException(
                status_code=400,
                detail="slot_start is required when slot_id is omitted",
            )
        confirmed = confirm_slot(token, slot_iso)
        if not confirmed:
            raise HTTPException(
                status_code=400,
                detail="Unknown token or slot not in available_slots",
            )

    booking_url = _public_booking_url(session.token)
    payload = BookingConfirmedPayload(
        lead_id=session.lead_id,
        email=session.email,
        selected_slot=session.selected_slot or slot_iso,
        booking_token=session.token,
    )
    notify = await _post_happyrobot_outbound(payload.model_dump())
    return {
        "ok": True,
        "lead_id": session.lead_id,
        "selected_slot": session.selected_slot,
        "booking_url": booking_url,
        **notify,
    }
