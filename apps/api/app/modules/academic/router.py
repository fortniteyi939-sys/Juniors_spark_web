from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.audit.service import record
from app.modules.academic.models import Course, CourseOffering, Enrollment, Instructor, Student
from app.modules.identity.dependencies import ensure, get_principal
from app.modules.identity.permissions import Principal, is_global, permissions_of

router = APIRouter(tags=["courses"])


class CourseIn(BaseModel):
    model_config = ConfigDict(extra="forbid")  # organization_id lo fija el backend, nunca el cliente

    code: str = Field(min_length=1, max_length=32, pattern=r"^[A-Za-z0-9._-]+$")
    title: str = Field(min_length=1, max_length=200)
    level: str = Field(min_length=1, max_length=32)
    status: Literal["draft", "published"] = "draft"


class CourseOut(BaseModel):
    id: UUID
    code: str
    title: str
    level: str
    status: str


class CoursePage(BaseModel):
    items: list[CourseOut]
    next_cursor: str | None


@router.post("/courses", status_code=201)
def create_course(
    body: CourseIn,
    request: Request,
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> CourseOut:
    ensure(principal, "courses:manage", organization_id=principal.organization_id)
    course = Course(organization_id=principal.organization_id, **body.model_dump())
    db.add(course)
    try:
        db.flush()
        record(db, principal, request, action="course.created", resource="course", resource_id=course.id,
               details={"code": body.code, "status": body.status})
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe un curso con ese código.") from exc
    return CourseOut.model_validate(course, from_attributes=True)


@router.get("/courses")
def list_courses(
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    after: Annotated[str | None, Query(max_length=32)] = None,
) -> CoursePage:
    """Catálogo paginado por cursor (spec 10.1). El alcance depende del rol (ABAC):
    administración/coordinación ven la institución; docente, sus cursos asignados; estudiante, los inscritos."""
    perms = permissions_of(principal)
    org = principal.organization_id
    stmt = select(Course).where(Course.organization_id == org)

    if is_global(principal) or "courses:manage" in perms:
        pass  # todos los estados de la institución
    elif "courses:read_aggregate" in perms:
        stmt = stmt.where(Course.status == "published")
    elif "courses:read_assigned" in perms:
        assigned = (
            select(CourseOffering.course_id)
            .join(Instructor, Instructor.id == CourseOffering.instructor_id)
            .where(Instructor.user_id == principal.user_id, CourseOffering.organization_id == org)
        )
        stmt = stmt.where(Course.id.in_(assigned))
    elif "courses:read_enrolled" in perms:
        enrolled = (
            select(CourseOffering.course_id)
            .join(Enrollment, Enrollment.offering_id == CourseOffering.id)
            .join(Student, Student.id == Enrollment.student_id)
            .where(Student.user_id == principal.user_id, Enrollment.organization_id == org)
        )
        stmt = stmt.where(Course.status == "published", Course.id.in_(enrolled))
    else:
        raise HTTPException(status_code=403, detail="Permiso insuficiente.")

    if after:
        stmt = stmt.where(Course.code > after)
    rows = list(db.scalars(stmt.order_by(Course.code).limit(limit + 1)))
    page, more = rows[:limit], len(rows) > limit
    return CoursePage(
        items=[CourseOut.model_validate(c, from_attributes=True) for c in page],
        next_cursor=page[-1].code if more else None,
    )
