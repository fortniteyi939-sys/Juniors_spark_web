from datetime import date, datetime
from typing import Annotated, Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.modules.academic.models import Course, CourseOffering, Enrollment, Instructor, Student
from app.modules.academic.rules import EnrollmentContext, can_transition, decide_enrollment
from app.modules.audit.service import record
from app.modules.identity.dependencies import ensure, get_principal
from app.modules.identity.models import Organization
from app.modules.identity.permissions import Principal

router = APIRouter(tags=["enrollments"])

NOT_FOUND = HTTPException(status_code=404, detail="Recurso no encontrado.")  # igual para "no existe" y "es de otra institución"


class OfferingIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    period: str = Field(min_length=1, max_length=32)
    instructor_id: UUID | None = None
    starts_on: date | None = None
    ends_on: date | None = None

    @model_validator(mode="after")
    def _dates(self) -> "OfferingIn":
        if self.starts_on and self.ends_on and self.ends_on < self.starts_on:
            raise ValueError("ends_on no puede ser anterior a starts_on")
        return self


class OfferingOut(BaseModel):
    id: UUID
    course_id: UUID
    period: str
    instructor_id: UUID | None
    starts_on: date | None
    ends_on: date | None


class EnrollmentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    student_id: UUID


class EnrollmentOut(BaseModel):
    id: UUID
    offering_id: UUID
    student_id: UUID
    status: str
    enrolled_at: datetime


_REJECTIONS: dict[str, tuple[int, str]] = {
    "already_enrolled": (409, "El estudiante ya está matriculado en esta oferta."),
    "already_completed": (409, "El estudiante ya completó esta oferta."),
    "course_not_published": (409, "El curso no está publicado."),
    "offering_closed": (409, "La oferta ya terminó."),
}


@router.post("/courses/{course_id}/offerings", status_code=201)
def create_offering(
    course_id: UUID,
    body: OfferingIn,
    request: Request,
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> OfferingOut:
    ensure(principal, "courses:manage", organization_id=principal.organization_id)
    org = principal.organization_id
    if db.scalar(select(Course.id).where(Course.id == course_id, Course.organization_id == org)) is None:
        raise NOT_FOUND
    if body.instructor_id is not None and db.scalar(
        select(Instructor.id).where(Instructor.id == body.instructor_id, Instructor.organization_id == org)
    ) is None:
        raise HTTPException(status_code=422, detail="Docente no encontrado en la institución.")

    offering = CourseOffering(organization_id=org, course_id=course_id, **body.model_dump())
    db.add(offering)
    db.flush()  # asigna id para auditarlo en la misma transacción
    record(db, principal, request, action="offering.created", resource="course_offering", resource_id=offering.id,
           details={"course_id": str(course_id), "period": body.period})
    db.commit()
    return OfferingOut.model_validate(offering, from_attributes=True)


@router.post("/offerings/{offering_id}/enrollments", status_code=201)
def enroll_student(
    offering_id: UUID,
    body: EnrollmentIn,
    request: Request,
    response: Response,
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> EnrollmentOut:
    """Matricula (201) o reactiva una matrícula retirada (200). La auto-matrícula del estudiante queda
    pendiente de decisión del Product Owner."""
    ensure(principal, "enrollments:manage", organization_id=principal.organization_id)
    org = principal.organization_id

    row = db.execute(
        select(CourseOffering, Course)
        .join(Course, Course.id == CourseOffering.course_id)
        .where(CourseOffering.id == offering_id, CourseOffering.organization_id == org)
    ).first()
    if row is None or db.scalar(select(Student.id).where(Student.id == body.student_id, Student.organization_id == org)) is None:
        raise NOT_FOUND
    offering, course = row
    existing = db.scalar(
        select(Enrollment).where(Enrollment.offering_id == offering_id, Enrollment.student_id == body.student_id)
    )
    organization = db.get(Organization, org)
    today = datetime.now(ZoneInfo(organization.timezone if organization else "UTC")).date()

    decision = decide_enrollment(EnrollmentContext(
        course_status=course.status,
        offering_ends_on=offering.ends_on,
        existing_status=existing.status if existing else None,
        today=today,
    ))
    if decision in _REJECTIONS:
        status, detail = _REJECTIONS[decision]
        raise HTTPException(status_code=status, detail=detail)

    if decision == "reactivate" and existing is not None:
        existing.status = "active"
        enrollment, action = existing, "enrollment.reactivated"
        response.status_code = 200
    else:
        enrollment = Enrollment(organization_id=org, offering_id=offering_id, student_id=body.student_id)
        db.add(enrollment)
        action = "enrollment.created"
    try:
        db.flush()
        record(db, principal, request, action=action, resource="enrollment", resource_id=enrollment.id,
               details={"offering_id": str(offering_id), "student_id": str(body.student_id)})
        db.commit()
    except IntegrityError as exc:  # carrera: otra solicitud creó la matrícula entre la lectura y el insert
        db.rollback()
        raise HTTPException(status_code=409, detail="El estudiante ya está matriculado en esta oferta.") from exc
    return EnrollmentOut.model_validate(enrollment, from_attributes=True)


@router.post("/enrollments/{enrollment_id}/withdraw")
def withdraw_enrollment(
    enrollment_id: UUID,
    request: Request,
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> EnrollmentOut:
    ensure(principal, "enrollments:manage", organization_id=principal.organization_id)
    enrollment = db.scalar(
        select(Enrollment).where(Enrollment.id == enrollment_id, Enrollment.organization_id == principal.organization_id)
    )
    if enrollment is None:
        raise NOT_FOUND
    if not can_transition(enrollment.status, "withdrawn"):
        raise HTTPException(status_code=409, detail=f"No se puede retirar una matrícula en estado '{enrollment.status}'.")
    enrollment.status = "withdrawn"
    record(db, principal, request, action="enrollment.withdrawn", resource="enrollment", resource_id=enrollment.id,
           details={"offering_id": str(enrollment.offering_id), "student_id": str(enrollment.student_id)})
    db.commit()
    return EnrollmentOut.model_validate(enrollment, from_attributes=True)


_ = Literal  # (reservado para estados tipados cuando se agregue el listado de matrículas)
