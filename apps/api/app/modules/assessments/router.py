from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.academic.models import Course, CourseOffering, Enrollment, Instructor, Student
from app.modules.assessments.models import Assessment, AssessmentAttempt
from app.modules.assessments.rules import (
    OBJECTIVE_TYPES,
    KeyItem,
    check_submission,
    grade_objective,
    max_score_of,
    official_score,
    validate_answers,
)
from app.modules.audit.service import record
from app.modules.identity.dependencies import ensure, get_principal
from app.modules.identity.permissions import Principal, is_global, permissions_of

router = APIRouter(tags=["assessments"])
NOT_FOUND = HTTPException(status_code=404, detail="Recurso no encontrado.")
Kind = Literal["multiple_choice", "true_false", "short_answer", "practice"]


# El tipo "file" (entrega de archivo) está en la especificación pero NO se ofrece todavía: requiere
# almacenamiento de objetos, límites de tamaño y análisis antimalware (spec 11). No se acepta a medias.
class QuestionKey(BaseModel):
    model_config = ConfigDict(extra="forbid")
    correct: str = Field(min_length=1, max_length=200)
    points: Decimal = Field(gt=0, le=1000, decimal_places=2)


class AssessmentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    type: Kind
    due_at: datetime | None = None
    max_attempts: int = Field(default=1, ge=1, le=10)
    allow_late: bool = False
    grading_policy: Literal["best", "last"] = "best"
    weight: Decimal = Field(default=Decimal(0), ge=0, le=100, decimal_places=2)
    max_score: Decimal | None = Field(default=None, gt=0, le=1000, decimal_places=2)
    answer_key: dict[str, QuestionKey] | None = None

    @model_validator(mode="after")
    def _coherence(self) -> "AssessmentIn":
        if self.due_at is not None and self.due_at.tzinfo is None:
            raise ValueError("due_at debe incluir zona horaria")
        if self.type in OBJECTIVE_TYPES:
            if not self.answer_key:
                raise ValueError("las evaluaciones objetivas requieren answer_key")
            total = sum((q.points for q in self.answer_key.values()), Decimal(0))
            if self.max_score is not None and self.max_score != total:
                raise ValueError("max_score debe coincidir con la suma de puntos de answer_key")
            self.max_score = total
        else:
            if self.answer_key is not None:
                raise ValueError("answer_key solo aplica a evaluaciones objetivas")
            if self.max_score is None:
                raise ValueError("max_score es obligatorio en evaluaciones de calificación manual")
        return self


class AssessmentOut(BaseModel):
    """Nunca incluye answer_key."""

    id: UUID
    course_id: UUID
    title: str
    type: str
    status: str
    due_at: datetime | None
    max_attempts: int
    allow_late: bool
    grading_policy: str
    weight: Decimal
    max_score: Decimal


class AttemptIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    answers: dict[str, str] = Field(default_factory=dict)


class AttemptOut(BaseModel):
    id: UUID
    assessment_id: UUID
    attempt_number: int
    status: str
    submitted_at: datetime
    is_late: bool
    score: Decimal | None


class GradeIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    score: Decimal = Field(ge=0, decimal_places=2)
    feedback: str | None = Field(default=None, max_length=2000)


class ResultOut(BaseModel):
    assessment_id: UUID
    grading_policy: str
    max_score: Decimal
    official_score: Decimal | None
    attempts: list[AttemptOut]


def _can_manage_course(db: Session, principal: Principal, course_id: UUID) -> bool:
    perms = permissions_of(principal)
    if is_global(principal) or "courses:manage" in perms:
        return True
    if "content:manage_assigned" in perms:  # docente: solo cursos con una oferta que tenga asignada
        return db.scalar(
            select(CourseOffering.id)
            .join(Instructor, Instructor.id == CourseOffering.instructor_id)
            .where(
                CourseOffering.course_id == course_id,
                CourseOffering.organization_id == principal.organization_id,
                Instructor.user_id == principal.user_id,
            )
            .limit(1)
        ) is not None
    return False


def _load_assessment(db: Session, principal: Principal, assessment_id: UUID) -> Assessment:
    found = db.scalar(
        select(Assessment).where(Assessment.id == assessment_id, Assessment.organization_id == principal.organization_id)
    )
    if found is None:
        raise NOT_FOUND
    return found


def _key_of(assessment: Assessment) -> dict[str, KeyItem] | None:
    if not assessment.answer_key:
        return None
    return {q: KeyItem(v["correct"], Decimal(str(v["points"]))) for q, v in assessment.answer_key.items()}


@router.post("/courses/{course_id}/assessments", status_code=201)
def create_assessment(
    course_id: UUID,
    body: AssessmentIn,
    request: Request,
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> AssessmentOut:
    org = principal.organization_id
    if db.scalar(select(Course.id).where(Course.id == course_id, Course.organization_id == org)) is None:
        raise NOT_FOUND
    if not _can_manage_course(db, principal, course_id):
        raise HTTPException(status_code=403, detail="Permiso insuficiente.")
    assert body.max_score is not None  # garantizado por el validador del modelo
    assessment = Assessment(
        organization_id=org,
        course_id=course_id,
        title=body.title,
        type=body.type,
        due_at=body.due_at,
        max_attempts=body.max_attempts,
        allow_late=body.allow_late,
        grading_policy=body.grading_policy,
        weight=body.weight,
        max_score=body.max_score,
        answer_key={q: {"correct": v.correct, "points": str(v.points)} for q, v in body.answer_key.items()}
        if body.answer_key
        else None,
    )
    db.add(assessment)
    db.flush()
    record(db, principal, request, action="assessment.created", resource="assessment", resource_id=assessment.id,
           details={"course_id": str(course_id), "type": body.type})
    db.commit()
    return AssessmentOut.model_validate(assessment, from_attributes=True)


@router.post("/assessments/{assessment_id}/publish")
def publish_assessment(
    assessment_id: UUID,
    request: Request,
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> AssessmentOut:
    assessment = _load_assessment(db, principal, assessment_id)
    if not _can_manage_course(db, principal, assessment.course_id):
        raise HTTPException(status_code=403, detail="Permiso insuficiente.")
    if assessment.status != "draft":
        raise HTTPException(status_code=409, detail=f"No se puede publicar una evaluación en estado '{assessment.status}'.")
    assessment.status = "published"
    record(db, principal, request, action="assessment.published", resource="assessment", resource_id=assessment.id)
    db.commit()
    return AssessmentOut.model_validate(assessment, from_attributes=True)


@router.post("/assessments/{assessment_id}/attempts", status_code=201)
def submit_attempt(
    assessment_id: UUID,
    body: AttemptIn,
    request: Request,
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> AttemptOut:
    """Entrega del estudiante (spec 5.2): valida identidad, matrícula, vigencia, intentos y formato;
    registra el intento y, si es objetivo, calcula la nota oficial con la llave del docente."""
    ensure(principal, "attempts:submit_own", organization_id=principal.organization_id, owner_user_id=principal.user_id)
    org = principal.organization_id
    assessment = _load_assessment(db, principal, assessment_id)
    student = db.scalar(select(Student).where(Student.user_id == principal.user_id, Student.organization_id == org))
    enrolled = student is not None and db.scalar(
        select(Enrollment.id)
        .join(CourseOffering, CourseOffering.id == Enrollment.offering_id)
        .where(
            Enrollment.student_id == student.id,
            Enrollment.organization_id == org,
            Enrollment.status == "active",
            CourseOffering.course_id == assessment.course_id,
        )
        .limit(1)
    ) is not None
    if student is None or not enrolled:
        raise HTTPException(status_code=403, detail="No está matriculado en el curso de esta evaluación.")

    used = db.scalar(
        select(func.count()).select_from(AssessmentAttempt).where(
            AssessmentAttempt.assessment_id == assessment.id, AssessmentAttempt.student_id == student.id
        )
    ) or 0
    verdict = check_submission(
        status=assessment.status,
        now=datetime.now(UTC),
        due_at=assessment.due_at,
        allow_late=assessment.allow_late,
        attempts_used=used,
        max_attempts=assessment.max_attempts,
    )
    rejections = {
        "not_published": "La evaluación no está disponible.",
        "no_attempts_left": "No quedan intentos.",
        "late_not_allowed": "La fecha de entrega ya venció.",
    }
    if verdict in rejections:
        raise HTTPException(status_code=409, detail=rejections[verdict])

    key = _key_of(assessment)
    problems = validate_answers(body.answers, key)
    if problems:
        raise HTTPException(status_code=422, detail="; ".join(problems))

    attempt = AssessmentAttempt(
        organization_id=org,
        assessment_id=assessment.id,
        student_id=student.id,
        attempt_number=used + 1,
        status="submitted",
        is_late=verdict == "ok_late",
        answers=body.answers,
    )
    if assessment.type in OBJECTIVE_TYPES and key is not None:
        attempt.score = grade_objective(key, body.answers)
        attempt.status = "graded"
        attempt.graded_at = datetime.now(UTC)  # graded_by queda en None: autocalificado
    db.add(attempt)
    try:
        db.flush()
        record(db, principal, request, action="attempt.submitted", resource="assessment_attempt", resource_id=attempt.id,
               details={"assessment_id": str(assessment.id), "attempt_number": attempt.attempt_number,
                        "late": attempt.is_late})
        db.commit()
    except IntegrityError as exc:  # entrega simultánea con el mismo número de intento
        db.rollback()
        raise HTTPException(status_code=409, detail="Conflicto al registrar el intento; reintente.") from exc
    return AttemptOut.model_validate(attempt, from_attributes=True)


@router.post("/attempts/{attempt_id}/grade")
def grade_attempt(
    attempt_id: UUID,
    body: GradeIn,
    request: Request,
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> AttemptOut:
    """Calificación manual por el docente del curso (spec 11.3). Solo intentos pendientes: una nota ya
    registrada no se sobrescribe aquí; corregirla requiere un flujo de ajuste justificado (pendiente)."""
    attempt = db.scalar(
        select(AssessmentAttempt).where(
            AssessmentAttempt.id == attempt_id, AssessmentAttempt.organization_id == principal.organization_id
        )
    )
    if attempt is None:
        raise NOT_FOUND
    assessment = _load_assessment(db, principal, attempt.assessment_id)
    if not _can_manage_course(db, principal, assessment.course_id):
        raise HTTPException(status_code=403, detail="Permiso insuficiente.")
    if attempt.status != "submitted":
        raise HTTPException(status_code=409, detail="El intento ya está calificado.")
    if body.score > assessment.max_score:
        raise HTTPException(status_code=422, detail=f"La nota no puede superar {assessment.max_score}.")
    attempt.score = body.score
    attempt.status = "graded"
    attempt.graded_by = principal.user_id
    attempt.graded_at = datetime.now(UTC)
    attempt.feedback = body.feedback
    record(db, principal, request, action="attempt.graded", resource="assessment_attempt", resource_id=attempt.id,
           details={"assessment_id": str(assessment.id), "score": str(body.score)})
    db.commit()
    return AttemptOut.model_validate(attempt, from_attributes=True)


@router.get("/assessments/{assessment_id}/results/me")
def my_result(
    assessment_id: UUID,
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> ResultOut:
    """Resultado propio: nota oficial según la regla de la evaluación. Por construcción solo devuelve
    intentos del estudiante autenticado (grades:read_own)."""
    ensure(principal, "grades:read_own", organization_id=principal.organization_id, owner_user_id=principal.user_id)
    assessment = _load_assessment(db, principal, assessment_id)
    student = db.scalar(
        select(Student).where(Student.user_id == principal.user_id, Student.organization_id == principal.organization_id)
    )
    if student is None:
        raise HTTPException(status_code=403, detail="El usuario no tiene perfil de estudiante.")
    attempts = list(
        db.scalars(
            select(AssessmentAttempt)
            .where(AssessmentAttempt.assessment_id == assessment.id, AssessmentAttempt.student_id == student.id)
            .order_by(AssessmentAttempt.attempt_number)
        )
    )
    policy: Literal["best", "last"] = "last" if assessment.grading_policy == "last" else "best"
    return ResultOut(
        assessment_id=assessment.id,
        grading_policy=assessment.grading_policy,
        max_score=assessment.max_score,
        official_score=official_score([(a.attempt_number, a.score) for a in attempts], policy),
        attempts=[AttemptOut.model_validate(a, from_attributes=True) for a in attempts],
    )


_ = max_score_of  # exportado para uso futuro (validaciones de llave en importaciones)
