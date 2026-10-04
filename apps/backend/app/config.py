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
    # LangSmith traces of the Jev calls; monitoring is off without a key (empty endpoint = SDK default, US)
    langsmith_api_key: SecretStr | None = None
    langsmith_project: str = "spotted-jev"
    langsmith_endpoint: str | None = None
    jev_model: str = "jev-1.13-free"
    jev_url: str = "https://opencode.ai/zen/v1/systemone"
    jev_timeout_seconds: float = 8.0
    # POST /events/parse: OpenAI-compatible chat model on OpenCode Zen, same OPENCODE_API_KEY
    parse_model: str = "minimax-m2.5-free"
    parse_url: str = "https://opencode.ai/zen/v1/chat/completions"
    parse_timeout_seconds: float = 20.0
    # GET /geocode: address suggestions from Photon (OpenStreetMap), identified by our User-Agent
    geocode_url: str = "https://photon.komoot.io/api/"
    # The same User-Agent identifies us to Photon, Transitous and Overpass; Transitous asks for contact details in it.
    geocode_user_agent: str = "spootted/0.1 (HackYeah 2026 demo; https://github.com/hackyeahKrakow/project)"
    geocode_timeout_seconds: float = 6.0
    # GET /transit/near: stops (GTFS) and disruptions (GTFS-Realtime ServiceAlerts) from ZTP Kraków open data
    gtfs_url: str = "https://gtfs.ztp.krakow.pl/"
    gtfs_timeout_seconds: float = 20.0
    # GET /route: journeys from Transitous (MOTIS over the ZTP GTFS); free for non-commercial, open-source projects
    route_url: str = "https://api.transitous.org/api/v5/plan"
    route_timeout_seconds: float = 15.0
    # GET /parking/near: car parks and spaces for people with disabilities from OpenStreetMap through Overpass
    overpass_url: str = "https://overpass-api.de/api/interpreter"
    overpass_timeout_seconds: float = 25.0

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
