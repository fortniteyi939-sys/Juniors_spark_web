from datetime import UTC, datetime, timedelta
from decimal import Decimal as D

from app.modules.assessments.rules import (
    KeyItem,
    check_submission,
    grade_objective,
    max_score_of,
    official_score,
    validate_answers,
)

KEY = {"q1": KeyItem("b", D(2)), "q2": KeyItem("true", D("1.5")), "q3": KeyItem("c", D(1))}
NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)


def sub(**over) -> str:
    base = dict(status="published", now=NOW, due_at=None, allow_late=False, attempts_used=0, max_attempts=2)
    base.update(over)
    return check_submission(**base)


def test_grading_sums_only_correct_answers() -> None:
    assert grade_objective(KEY, {"q1": "b", "q2": "false", "q3": "c"}) == D(3)
    assert grade_objective(KEY, {}) == D(0)
    assert grade_objective(KEY, {"q1": "B"}) == D(0)  # coincidencia exacta, sin adivinar equivalencias


def test_max_score_is_sum_of_points() -> None:
    assert max_score_of(KEY) == D("4.5")


def test_answer_validation() -> None:
    assert validate_answers({"q1": "b"}, KEY) == []
    assert validate_answers({"zz": "b"}, KEY)
    assert validate_answers({"q1": "x" * 20000}, KEY)
    assert validate_answers({"anything": "free text"}, None) == []  # sin llave (respuesta abierta)


def test_submission_checks() -> None:
    assert sub() == "ok"
    assert sub(status="draft") == "not_published"
    assert sub(status="closed") == "not_published"
    assert sub(attempts_used=2) == "no_attempts_left"
    assert sub(due_at=NOW - timedelta(minutes=1)) == "late_not_allowed"
    assert sub(due_at=NOW - timedelta(minutes=1), allow_late=True) == "ok_late"
    assert sub(due_at=NOW + timedelta(minutes=1)) == "ok"


def test_no_attempts_left_wins_over_late_policy() -> None:
    assert sub(attempts_used=2, due_at=NOW - timedelta(days=1), allow_late=True) == "no_attempts_left"


def test_official_score_best() -> None:
    assert official_score([(1, D(2)), (2, D(4)), (3, None)], "best") == D(4)
    assert official_score([(1, None)], "best") is None
    assert official_score([], "best") is None


def test_official_score_last_requires_latest_attempt_graded() -> None:
    assert official_score([(1, D(4)), (2, D(2))], "last") == D(2)
    assert official_score([(1, D(4)), (2, None)], "last") is None  # no se usa un intento obsoleto
    assert official_score([(2, D(1)), (1, D(5))], "last") == D(1)  # orden de entrada irrelevante
