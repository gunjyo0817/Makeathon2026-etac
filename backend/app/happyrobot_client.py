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
