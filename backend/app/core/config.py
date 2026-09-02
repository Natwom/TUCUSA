from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Defaults for local development; Render env vars will override these
    DATABASE_URL: str = "sqlite:///./tucusa.db"  # Safer default than localhost PG
    SECRET_KEY: str = "tucusa-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day
    ADMIN_SECRET_KEY: str = "admin-secret-key"

    # Pydantic v2 config syntax
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()