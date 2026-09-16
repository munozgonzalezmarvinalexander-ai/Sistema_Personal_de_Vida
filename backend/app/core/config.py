from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str

    @field_validator("DATABASE_URL")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    ENVIRONMENT: str = "development"

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_secure(cls, v: str) -> str:
        insecure = {
            "",
            "change-this-to-a-random-secret-key",
            "change-this-generate-a-real-secret-key-with-the-command-above",
            "changeme",
            "dev-only-change-in-production-minimum-length",
            "secret",
        }
        normalized = v.strip().lower()
        if normalized in insecure or len(v.strip()) < 32:
            raise ValueError(
                "SECRET_KEY is insecure. Set a random string of at least 32 characters. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )
        return v

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    model_config = {"env_file": ".env"}


settings = Settings()
