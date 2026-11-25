from datetime import UTC, datetime, timedelta, timezone

from app.modules.academic.progress import completion_ratio
from app.modules.tracking.validation import MAX_DURATION_SECONDS, check_event

NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)


def ok(**over):
    args = dict(event_type="lesson_viewed", occurred_at=NOW, duration_seconds=60, payload={}, now=NOW)
    args.update(over)
    return check_event(**args)


def test_valid_event_has_no_problems() -> None:
    assert ok() == []


def test_client_cannot_report_official_events() -> None:
    assert ok(event_type="course_completed")
    assert ok(event_type="assessment_submitted")
    assert ok(event_type="inventado")


def test_naive_and_non_utc_timestamps_rejected() -> None:
    assert ok(occurred_at=datetime(2026, 11, 25, 12, 0))
    assert ok(occurred_at=datetime(2026, 11, 25, 7, 0, tzinfo=timezone(timedelta(hours=-5))))


def test_future_events_rejected_but_small_skew_allowed() -> None:
    assert ok(occurred_at=NOW + timedelta(minutes=4)) == []
    assert ok(occurred_at=NOW + timedelta(minutes=6))


def test_duration_bounds() -> None:
    assert ok(duration_seconds=-1)
    assert ok(duration_seconds=MAX_DURATION_SECONDS + 1)
    assert ok(duration_seconds=0) == []
    assert ok(duration_seconds=None) == []


def test_oversized_payload_rejected() -> None:
    assert ok(payload={"x": "a" * 9000})


def test_completion_ratio() -> None:
    assert completion_ratio(3, 4) == 0.75
    assert completion_ratio(5, 4) == 1.0  # acotado a [0,1]
    assert completion_ratio(0, 0) is None


from datetime import date  # noqa: E402

from app.modules.academic.rules import EnrollmentContext, can_transition, decide_enrollment  # noqa: E402

TODAY = date(2026, 11, 25)


def ctx(**over) -> EnrollmentContext:
    base = dict(course_status="published", offering_ends_on=None, existing_status=None, today=TODAY)
    base.update(over)
    return EnrollmentContext(**base)


def test_enrollment_decisions() -> None:
    assert decide_enrollment(ctx()) == "create"
    assert decide_enrollment(ctx(existing_status="withdrawn")) == "reactivate"
    assert decide_enrollment(ctx(existing_status="active")) == "already_enrolled"
    assert decide_enrollment(ctx(existing_status="completed")) == "already_completed"


def test_unpublished_course_blocks_enrollment() -> None:
    assert decide_enrollment(ctx(course_status="draft")) == "course_not_published"
    assert decide_enrollment(ctx(course_status="archived", existing_status="withdrawn")) == "course_not_published"


def test_closed_offering_blocks_enrollment_but_last_day_is_open() -> None:
    assert decide_enrollment(ctx(offering_ends_on=date(2026, 11, 24))) == "offering_closed"
    assert decide_enrollment(ctx(offering_ends_on=TODAY)) == "create"


def test_completed_is_never_reachable_through_the_api() -> None:
    assert not can_transition("active", "completed")
    assert not can_transition("completed", "active")
    assert can_transition("active", "withdrawn")
    assert can_transition("withdrawn", "active")
    assert not can_transition("inventado", "active")
