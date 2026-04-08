from functools import lru_cache

from dotenv import load_dotenv
from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


# Load environment variables from a local .env file when present.
load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = Field(default="Fake News Detection API")
    app_version: str = Field(default="1.0.0")
    app_description: str = Field(
        default="Backend API for a Fake News Detection System"
    )
    environment: str = Field(default="development")
    api_v1_prefix: str = Field(default="/api/v1")

    # Comma-separated origins can be added later through the environment.
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])

    # MongoDB settings are prepared for future integration.
    mongodb_uri: str = Field(default="mongodb://localhost:27017")
    mongodb_db_name: str = Field(default="fake_news_detection")
    mongodb_predictions_collection: str = Field(default="predictions")

    # CrewAI-related configuration hooks can be expanded later.
    crewai_enabled: bool = Field(default=False)
    crewai_model: str = Field(default="gpt-4o-mini")
    crewai_api_base: AnyHttpUrl | None = Field(default=None)

    # Firebase Admin SDK settings for JWT verification.
    firebase_service_account_path: str | None = Field(default=None)
    firebase_project_id: str | None = Field(default=None)
    firebase_enabled: bool = Field(default=True)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


# Shared settings object for application-wide imports.
settings = get_settings()
