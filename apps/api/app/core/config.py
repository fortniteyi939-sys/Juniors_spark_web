from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración externa por ambiente (spec 6.4). Los secretos vienen del entorno, nunca del repositorio."""

    model_config = SettingsConfigDict(env_prefix="EDUMASTER_", env_file=".env", extra="ignore")

    env: Literal["local", "development", "staging", "production"] = "local"
    database_url: str = ""
    redis_url: str = ""
    cors_origins: list[str] = []
    # OIDC: proveedor aún no decidido (spec 10.1). Sin configurar, la autenticación falla cerrada (503).
    oidc_issuer: str = ""
    oidc_audience: str = ""
    oidc_jwks_url: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
