from typing import Any

import httpx

from .config import settings


class HappyRobotClient:
    def __init__(self) -> None:
        self.base_url = settings.happyrobot_base_url.rstrip("/")
        self.api_key = settings.happyrobot_api_key
        self.timeout = settings.happyrobot_timeout_seconds

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def _request(
        self, method: str, path: str, json: dict[str, Any] | None = None
    ) -> Any:
        url = f"{self.base_url}{path}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=self._headers(),
                json=json,
            )
            response.raise_for_status()
            if not response.content:
                return {}
            return response.json()

    async def _request_absolute(
        self, method: str, url: str, json: dict[str, Any] | None = None
    ) -> Any:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.request(
                method=method,
                url=url,
                headers={"Content-Type": "application/json"},
                json=json,
            )
            response.raise_for_status()
            if not response.content:
                return {}
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type.lower():
                return response.json()
            return {"text": response.text}

    async def get_schema(self) -> list[dict[str, Any]]:
        return await self._request("GET", "/twin/schema")

    async def get_table_rows(self, table_name: str) -> dict[str, Any]:
        return await self._request("GET", f"/twin/tables/{table_name}")

    async def insert_table_row(
        self, table_name: str, values: dict[str, Any]
    ) -> dict[str, Any]:
        return await self._request(
            "POST",
            f"/twin/tables/{table_name}/rows",
            json={"values": values},
        )

    async def update_table_row(
        self, table_name: str, primary_key: dict[str, Any], updates: dict[str, Any]
    ) -> dict[str, Any]:
        return await self._request(
            "PATCH",
            f"/twin/tables/{table_name}/rows",
            json={"primaryKey": primary_key, "updates": updates},
        )

    async def delete_table_rows(
        self, table_name: str, row_keys: list[dict[str, Any]]
    ) -> dict[str, Any]:
        return await self._request(
            "DELETE",
            f"/twin/tables/{table_name}/rows",
            json={"rowKeys": row_keys},
        )

    async def execute_sql(self, sql: str) -> dict[str, Any]:
        return await self._request("POST", "/twin/sql", json={"sql": sql})

    async def trigger_phone_call(self, customer_id: str) -> dict[str, Any]:
        return await self._request_absolute(
            "POST",
            settings.happyrobot_phone_call_webhook_url,
            json={"action_type": "phone_call", "customer_id": customer_id},
        )
