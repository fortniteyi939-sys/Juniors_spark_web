"""Reglas de evaluación (spec 4.6 y 5.2). Lógica pura: sin base de datos ni framework.

La nota aquí calculada es la OFICIAL. Las estimaciones de IA viven en otra tabla (predictions) y nunca
se mezclan con ella (spec 4.6 y 5.2).
"""

import json
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Final, Literal

OBJECTIVE_TYPES: Final = frozenset({"multiple_choice", "true_false"})
MAX_ANSWERS_BYTES: Final = 16 * 1024

SubmissionCheck = Literal["ok", "ok_late", "not_published", "no_attempts_left", "late_not_allowed"]


@dataclass(frozen=True, slots=True)
class KeyItem:
    correct: str
    points: Decimal


def grade_objective(key: dict[str, KeyItem], answers: dict[str, str]) -> Decimal:
    """Suma los puntos de cada pregunta cuya respuesta coincide exactamente. Sin respuesta = 0 puntos."""
    return sum((item.points for qid, item in key.items() if answers.get(qid) == item.correct), Decimal(0))


def max_score_of(key: dict[str, KeyItem]) -> Decimal:
    return sum((item.points for item in key.values()), Decimal(0))


def validate_answers(answers: dict[str, str], key: dict[str, KeyItem] | None) -> list[str]:
    problems: list[str] = []
    if len(json.dumps(answers, separators=(",", ":")).encode()) > MAX_ANSWERS_BYTES:
        problems.append(f"las respuestas exceden {MAX_ANSWERS_BYTES} bytes")
    if key is not None:
        unknown = sorted(set(answers) - set(key))
        if unknown:
            problems.append(f"preguntas inexistentes: {', '.join(unknown)}")
    return problems


def check_submission(
    *,
    status: str,
    now: datetime,
    due_at: datetime | None,
    allow_late: bool,
    attempts_used: int,
    max_attempts: int,
) -> SubmissionCheck:
    if status != "published":
        return "not_published"
    if attempts_used >= max_attempts:
        return "no_attempts_left"
    if due_at is not None and now > due_at:
        return "ok_late" if allow_late else "late_not_allowed"
    return "ok"


def official_score(attempts: list[tuple[int, Decimal | None]], policy: Literal["best", "last"]) -> Decimal | None:
    """Nota oficial de una evaluación según la regla del curso. attempts = (número de intento, nota o None).

    best: la mejor nota entre los intentos calificados.
    last: la del último intento; si ese aún no está calificado, no hay nota oficial todavía (None),
    en lugar de usar un intento anterior que ya no es el vigente.
    """
    if not attempts:
        return None
    if policy == "best":
        graded = [score for _, score in attempts if score is not None]
        return max(graded) if graded else None
    return max(attempts, key=lambda a: a[0])[1]
