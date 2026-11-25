import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

_PK = {"primary_key": True, "server_default": text("gen_random_uuid()")}


class Assessment(Base):
    __tablename__ = "assessments"
    __table_args__ = (
        ForeignKeyConstraint(["course_id", "organization_id"], ["courses.id", "courses.organization_id"]),
        UniqueConstraint("id", "organization_id", name="uq_assessments_id_org"),
        CheckConstraint("status in ('draft','published','closed')", name="ck_assessments_status"),
        CheckConstraint(
            "type in ('multiple_choice','true_false','short_answer','practice')", name="ck_assessments_type"
        ),
        CheckConstraint("grading_policy in ('best','last')", name="ck_assessments_policy"),
        CheckConstraint("max_attempts between 1 and 10", name="ck_assessments_attempts"),
        CheckConstraint("weight between 0 and 100", name="ck_assessments_weight"),
        CheckConstraint("max_score > 0", name="ck_assessments_max_score"),
        Index("ix_assessments_course", "course_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), **_PK)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    course_id: Mapped[uuid.UUID] = mapped_column()
    title: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(24))
    status: Mapped[str] = mapped_column(String(16), server_default="draft")
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    max_attempts: Mapped[int] = mapped_column(Integer, server_default="1")
    allow_late: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    grading_policy: Mapped[str] = mapped_column(String(8), server_default="best")
    weight: Mapped[Decimal] = mapped_column(Numeric(5, 2), server_default="0")
    max_score: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    # Llave de respuestas {"q1": {"correct": "b", "points": 2}}. Nunca se devuelve por la API.
    answer_key: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    __table_args__ = (
        ForeignKeyConstraint(
            ["assessment_id", "organization_id"], ["assessments.id", "assessments.organization_id"]
        ),
        ForeignKeyConstraint(["student_id", "organization_id"], ["students.id", "students.organization_id"]),
        # Dos entregas simultáneas no pueden tomar el mismo número de intento.
        UniqueConstraint("assessment_id", "student_id", "attempt_number", name="uq_attempts_number"),
        CheckConstraint("status in ('submitted','graded')", name="ck_attempts_status"),
        CheckConstraint("score is null or score >= 0", name="ck_attempts_score"),
        CheckConstraint("(status = 'graded') = (score is not null)", name="ck_attempts_graded_has_score"),
        Index("ix_attempts_student", "student_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), **_PK)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    assessment_id: Mapped[uuid.UUID] = mapped_column()
    student_id: Mapped[uuid.UUID] = mapped_column()
    attempt_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(16))
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_late: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    answers: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    # Nota OFICIAL. Las estimaciones de IA van en la tabla predictions, nunca en assessment_attempts.
    # is_oficial=True significa que esta calificación fue conferida por el docente según rúbrica oficial.
    # is_oficial=False o NULL indica que es una estimación predictiva del modelo (solo paradisplay con distintivo).
    is_oficial: Mapped[bool] = mapped_column(Boolean, server_default="true",
        comment="True = calificación oficial por docente; False/NULL = estimación predictiva IA")
    score: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    graded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))  # None = autocalificado
    graded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    feedback: Mapped[str | None] = mapped_column(String(2000))
