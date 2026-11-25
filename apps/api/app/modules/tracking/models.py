import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LearningEvent(Base):
    __tablename__ = "learning_events"
    __table_args__ = (
        ForeignKeyConstraint(["course_id", "organization_id"], ["courses.id", "courses.organization_id"]),
        ForeignKeyConstraint(["student_id", "organization_id"], ["students.id", "students.organization_id"]),
        # Idempotencia: el mismo event_id no se registra dos veces dentro de una institución.
        UniqueConstraint("organization_id", "event_id", name="uq_events_org_event"),
        CheckConstraint("duration_seconds is null or (duration_seconds between 0 and 14400)", name="ck_events_duration"),
        CheckConstraint("source in ('web','mobile','import','integration')", name="ck_events_source"),
        # Un evento DEMO no debe usarse para afirmar validez educativa (spec 8.1, 8.6).
        # El frontend y los conectores deben establecer demo=True al ingerir datos sintéticos.
        CheckConstraint(
            "demo IN (true, false) OR demo IS NULL",
            name="ck_events_demo_boolean",
            # Nota: SQLite no soporta CHECK de booleanas tan estrictamente; el control
            # se hace mayormente en la capa de aplicación y en el conector de ingestion.
        ),
        Index("ix_events_org_occurred", "organization_id", "occurred_at"),
        Index("ix_events_student_course", "student_id", "course_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    student_id: Mapped[uuid.UUID] = mapped_column()
    course_id: Mapped[uuid.UUID] = mapped_column()
    activity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    event_type: Mapped[str] = mapped_column(String(48))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    payload_schema_version: Mapped[int] = mapped_column(Integer, server_default="1")
    source: Mapped[str] = mapped_column(String(16))
    correlation_id: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    demo: Mapped[bool] = mapped_column(
        Boolean,
        server_default="false",
        comment="Flag DEMO: True = dato sintético de prueba; False = dato real. "
                "No permite afirmar validez educativa si es True (spec 8.1, 8.6).",
    )
