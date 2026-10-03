from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Card Swipe API"
    environment: str = "dev"
    log_level: str = "INFO"
    database_url: str = "sqlite+aiosqlite:///./app.db"  # or libsql://<db>.turso.io for Turso
    database_auth_token: SecretStr | None = None  # Turso auth token, only for libsql:// URLs
    api_key: SecretStr | None = None
    cors_origins: str = "http://localhost:5173"
    opencode_api_key: SecretStr | None = None
    jev_model: str = "jev-1.13-free"
    jev_url: str = "https://opencode.ai/zen/v1/systemone"
    jev_timeout_seconds: float = 8.0

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
