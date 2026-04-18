from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ETAC Backend"
    app_env: str = "dev"
    happyrobot_base_url: str = Field(
        default="https://platform.eu.happyrobot.ai/api/v2"
    )
    happyrobot_api_key: str = Field(default="")
    happyrobot_timeout_seconds: float = Field(default=20.0)
    happyrobot_phone_call_webhook_url: str = Field(
        default="https://workflows.platform.eu.happyrobot.ai/hooks/development/efwz3e8csw3l"
    )
    # Comma-separated browser origins, or "*" for any (credentials off — fine for this API).
    cors_origins: str = Field(default="*")


settings = Settings()
