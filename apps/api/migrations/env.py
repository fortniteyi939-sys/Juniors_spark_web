from alembic import context
from sqlalchemy import create_engine

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import normalize_url
from app.modules.academic import models as academic_models  # noqa: F401
from app.modules.assessments import models as assessment_models  # noqa: F401
from app.modules.audit import models as audit_models  # noqa: F401
from app.modules.identity import models  # noqa: F401  (registra las tablas)
from app.modules.tracking import models as tracking_models  # noqa: F401

target_metadata = Base.metadata


def run_migrations_online() -> None:
    url = get_settings().database_url
    if not url:
        raise RuntimeError("EDUMASTER_DATABASE_URL no está configurada")
    with create_engine(normalize_url(url)).connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()
