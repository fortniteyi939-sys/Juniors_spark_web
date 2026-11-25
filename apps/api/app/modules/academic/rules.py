"""Reglas de matrícula (spec 4.3, 5.1). Lógica pura."""

from dataclasses import dataclass
from datetime import date
from typing import Final, Literal

Decision = Literal["create", "reactivate", "already_enrolled", "already_completed", "course_not_published", "offering_closed"]

# Transiciones permitidas por la API. "completed" NO figura: solo la concede el backend al cumplirse
# los criterios oficiales de finalización (spec 5.1), nunca una solicitud de usuario.
API_TRANSITIONS: Final[dict[str, frozenset[str]]] = {
    "active": frozenset({"withdrawn"}),
    "withdrawn": frozenset({"active"}),
    "completed": frozenset(),
}


@dataclass(frozen=True, slots=True)
class EnrollmentContext:
    course_status: str
    offering_ends_on: date | None
    existing_status: str | None  # None si no hay matrícula previa del estudiante en esa oferta
    today: date


def decide_enrollment(ctx: EnrollmentContext) -> Decision:
    if ctx.course_status != "published":
        return "course_not_published"
    if ctx.offering_ends_on is not None and ctx.offering_ends_on < ctx.today:
        return "offering_closed"
    if ctx.existing_status == "active":
        return "already_enrolled"
    if ctx.existing_status == "completed":
        return "already_completed"
    if ctx.existing_status == "withdrawn":
        return "reactivate"
    return "create"


def can_transition(current: str, target: str) -> bool:
    return target in API_TRANSITIONS.get(current, frozenset())
