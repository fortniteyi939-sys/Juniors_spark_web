from datetime import datetime
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.academic.models import CourseOffering, Enrollment, Student
from app.modules.identity.dependencies import ensure, get_principal
from app.modules.identity.permissions import Principal
from app.modules.tracking.models import LearningEvent
from app.modules.tracking.validation import check_event

router = APIRouter(tags=["tracking"])


class LearningEventIn(BaseModel):
    # extra="forbid": el cliente no puede enviar organization_id, student_id ni actor; salen de la sesión.
    model_config = ConfigDict(extra="forbid")

    event_id: UUID
    event_type: str = Field(max_length=48)
    occurred_at: datetime
    course_id: UUID
    activity_id: UUID | None = None
    duration_seconds: int | None = None
    payload_schema_version: int = Field(default=1, ge=1)
    source: Literal["web", "mobile"] = "web"
    payload: dict[str, Any] = Field(default_factory=dict)


class EventAck(BaseModel):
    event_id: UUID
    status: Literal["accepted", "duplicate"]


@router.post("/learning-events", status_code=201)
def ingest_learning_event(
    body: LearningEventIn,
    request: Request,
    response: Response,
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> EventAck:
    """Ingesta idempotente (spec 10.1): 201 si se registra, 200 si el event_id ya existía en la institución."""
    ensure(principal, "events:write_own", organization_id=principal.organization_id, owner_user_id=principal.user_id)

    problems = check_event(
        event_type=body.event_type,
        occurred_at=body.occurred_at,
        duration_seconds=body.duration_seconds,
        payload=body.payload,
    )
    if problems:
        raise HTTPException(status_code=422, detail="; ".join(problems))

    org = principal.organization_id
    student = db.scalar(select(Student).where(Student.user_id == principal.user_id, Student.organization_id == org))
    if student is None:
        raise HTTPException(status_code=403, detail="El usuario no tiene perfil de estudiante.")
    enrolled = db.scalar(
        select(Enrollment.id)
        .join(CourseOffering, CourseOffering.id == Enrollment.offering_id)
        .where(
            Enrollment.student_id == student.id,
            Enrollment.organization_id == org,
            Enrollment.status == "active",
            CourseOffering.course_id == body.course_id,
        )
        .limit(1)
    )
    if enrolled is None:
        raise HTTPException(status_code=403, detail="No está matriculado en ese curso.")

    stmt = (
        pg_insert(LearningEvent)
        .values(
            event_id=body.event_id,
            organization_id=org,
            student_id=student.id,
            course_id=body.course_id,
            activity_id=body.activity_id,
            event_type=body.event_type,
            occurred_at=body.occurred_at,
            duration_seconds=body.duration_seconds,
            payload_schema_version=body.payload_schema_version,
            source=body.source,
            correlation_id=str(request.state.correlation_id),
            payload=body.payload,
        )
        .on_conflict_do_nothing(index_elements=["organization_id", "event_id"])
        .returning(LearningEvent.id)
    )
    inserted = db.scalar(stmt)
    db.commit()
    if inserted is None:
        response.status_code = 200
        return EventAck(event_id=body.event_id, status="duplicate")
    return EventAck(event_id=body.event_id, status="accepted")
