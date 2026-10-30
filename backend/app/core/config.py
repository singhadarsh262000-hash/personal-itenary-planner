from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "Personalized Travel Itinerary Planner"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Server settings
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000

    # CORS origins - Allow both local development and deployed Vercel frontend
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://personal-itinerary-planner-cg5r80gbt-av-team3.vercel.app",
    ]

    # Regex pattern to match all Vercel preview and production deployments for this app
    CORS_ORIGIN_REGEX: str = Field(
        default=r"^https:\/\/personal-itinerary-planner.*\.vercel\.app$",
        description="Regex pattern to allow Vercel preview and production deployments"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        origins: List[str] = []
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        origins = [str(i).strip().strip("'\"").rstrip("/") for i in parsed if str(i).strip()]
                except Exception:
                    pass
            if not origins:
                # Comma or newline separated
                raw_items = [item.strip() for item in v_str.replace("\n", ",").split(",") if item.strip()]
                origins = [item.strip("'\"").rstrip("/") for item in raw_items if item]
        elif isinstance(v, list):
            origins = [str(i).strip().strip("'\"").rstrip("/") for i in v if str(i).strip()]

        # Always ensure standard local development origins and known Vercel preview origin are included
        essential_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://personal-itinerary-planner-cg5r80gbt-av-team3.vercel.app",
        ]
        for origin in essential_origins:
            if origin not in origins:
                origins.append(origin)

        return origins

    # AI Configuration (Groq API, configurable via env var)
    GROQ_API_KEY: str = Field(default="", description="Groq API Key")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-120b", description="Supported Groq model name")
    AI_TIMEOUT_SECONDS: int = 45
    AI_MAX_RETRIES: int = 2

    @property
    def GEMINI_API_KEY(self) -> str:
        """Compatibility property for legacy references."""
        return self.GROQ_API_KEY

    @property
    def GEMINI_MODEL(self) -> str:
        """Compatibility property for legacy references."""
        return self.GROQ_MODEL

    # Business rules
    MAX_TRIP_DAYS: int = 14
    MIN_TRIP_DAYS: int = 1
    MAX_TRAVELERS: int = 20
    MIN_TRAVELERS: int = 1


settings = Settings()
