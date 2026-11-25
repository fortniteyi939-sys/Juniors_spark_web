from collections.abc import Iterator
from functools import lru_cache

from fastapi import HTTPException
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def normalize_url(url: str) -> str:
    """Docker/compose entrega postgresql://; SQLAlchemy con psycopg 3 necesita postgresql+psycopg://."""
    return url.replace("postgresql://", "postgresql+psycopg://", 1) if url.startswith("postgresql://") else url


@lru_cache
def get_engine() -> Engine:
    url = get_settings().database_url
    if not url:
        raise RuntimeError("EDUMASTER_DATABASE_URL no está configurada")
    return create_engine(normalize_url(url), pool_pre_ping=True)


def get_db() -> Iterator[Session]:
    try:
        factory = sessionmaker(get_engine(), expire_on_commit=False)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Base de datos no configurada.") from exc
    with factory() as session:
        yield session
