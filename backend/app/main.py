from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://localhost:8080",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
