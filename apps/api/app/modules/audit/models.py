import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DDL, DateTime, ForeignKey, Index, String, event, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.modules.audit.immutability import FUNCTION_SQL, TRIGGER_SQL


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_org_occurred", "organization_id", "occurred_at"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    # Sin FK: el registro debe sobrevivir aunque el usuario se elimine o anonimice.
    actor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    action: Mapped[str] = mapped_column(String(64))
    resource: Mapped[str] = mapped_column(String(48))
    resource_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    correlation_id: Mapped[str] = mapped_column(String(64))
    # Solo identificadores y metadatos; nunca datos personales (minimización, spec 12).
    details: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))


# Mismo DDL que la migración, para que create_all (pruebas) y Alembic produzcan el mismo esquema.
event.listen(AuditLog.__table__, "after_create", DDL(FUNCTION_SQL).execute_if(dialect="postgresql"))
event.listen(AuditLog.__table__, "after_create", DDL(TRIGGER_SQL).execute_if(dialect="postgresql"))
