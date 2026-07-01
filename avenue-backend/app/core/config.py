from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_ENV: str = "development"
    APP_NAME: str = "Avenue"
    FRONTEND_URL: str = "http://localhost:3000"

    # Security
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Nomba
    NOMBA_BASE_URL: str = "https://api.nomba.com/v1"

    # AI Engine
    OPENAI_API_KEY: str
    AI_CONFIDENCE_THRESHOLD: float = 0.75

    # Outbound Webhooks
    WEBHOOK_MAX_RETRIES: int = 5

    # Email
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "hello@avenue.so"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
