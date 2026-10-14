import secrets
from functools import lru_cache
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

WEAK_KEYS = {
    "",
    "tucusa-super-secret-key-change-in-production",
    "admin-secret-key",
    "secret",
    "changeme",
}


class Settings(BaseSettings):
    # "production" (default, secure) or "development" (set in your local .env)
    ENVIRONMENT: str = "production"

    DATABASE_URL: str = "sqlite:///./tucusa.db"

    # REQUIRED in production: at least 32 random characters.
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ADMIN_TOKEN_EXPIRE_MINUTES: int = 60

    FRONTEND_URL: str = ""
    ADMIN_URL: str = ""

    # --- brute-force protection ---
    LOCKOUT_WINDOW_MINUTES: int = 15
    MAX_FAILED_PER_ACCOUNT_AND_IP: int = 5
    MAX_FAILED_PER_ACCOUNT: int = 10
    MAX_FAILED_PER_IP: int = 50  # high on purpose: many students may share one campus IP
    GLOBAL_RATE_LIMIT_PER_MINUTE: int = 600
    MAX_REQUEST_BODY_MB: int = 12

    # Number of proxies in front of the app (Render + Cloudflare = 2).
    TRUSTED_PROXY_HOPS: int = 2

    # --- alerting (Resend HTTP API; works on Render free tier, SMTP does not) ---
    RESEND_API_KEY: str = ""
    ALERT_EMAIL_TO: str = ""  # comma separated
    ALERT_FROM_EMAIL: str = "TUCUSA Security <onboarding@resend.dev>"
    ALERT_COOLDOWN_MINUTES: int = 30
    EVENT_RETENTION_DAYS: int = 90

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @model_validator(mode="after")
    def _validate_secret(self):
        if self.SECRET_KEY in WEAK_KEYS or len(self.SECRET_KEY) < 32:
            if self.is_production:
                raise ValueError(
                    "SECRET_KEY is missing, weak or default. Set a random value of at least "
                    "32 characters in the environment (python -c \"import secrets; print(secrets.token_urlsafe(48))\")."
                )
            # development only: ephemeral key, tokens reset on every restart
            self.SECRET_KEY = secrets.token_urlsafe(48)
        return self


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()