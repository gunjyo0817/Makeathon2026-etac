from typing import Any

from pydantic import BaseModel, Field


class TableRowCreate(BaseModel):
    values: dict[str, Any]


class TableRowDelete(BaseModel):
    rowKeys: list[dict[str, Any]] = Field(default_factory=list)


class TableRowUpdate(BaseModel):
    primaryKey: dict[str, Any]
    updates: dict[str, Any]


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: int
    texture: str | None = None


class LeadCreate(BaseModel):
    full_name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    status: str = "new"
