"""Pruebas contra PostgreSQL real. Se omiten sin EDUMASTER_TEST_DATABASE_URL.
Ejemplo: EDUMASTER_TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/edumaster_test pytest
Usar una base DESECHABLE: el fixture borra y recrea todas las tablas."""

import os
from collections.abc import Iterator
from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import get_db, normalize_url
from app.main import create_app
from sqlalchemy import text

from app.modules.academic.models import Course, CourseOffering, Enrollment, Student
from app.modules.audit.models import AuditLog
from app.modules.identity.dependencies import get_principal
from app.modules.identity.models import Organization, User
from app.modules.identity.permissions import Principal, Role

URL = os.environ.get("EDUMASTER_TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not URL, reason="EDUMASTER_TEST_DATABASE_URL no definida")


@pytest.fixture
def world() -> Iterator[dict]:
    engine = create_engine(normalize_url(URL or ""))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as db:
        orgs = [Organization(code=c, name=c) for c in ("A", "B")]
        db.add_all(orgs)
        db.flush()
        users = [
            User(organization_id=o.id, email=f"s@{o.code}", email_normalized=f"s@{o.code}", full_name="x", status="active")
            for o in orgs
        ]
        db.add_all(users)
        db.flush()
        students = [Student(organization_id=o.id, user_id=u.id) for o, u in zip(orgs, users, strict=True)]
        courses = [Course(organization_id=o.id, code="C1", title="t", level="basic", status="published") for o in orgs]
        db.add_all([*students, *courses])
        db.flush()
        offs = [CourseOffering(organization_id=o.id, course_id=c.id, period="2026-II") for o, c in zip(orgs, courses, strict=True)]
        db.add_all(offs)
        db.flush()
        db.add(Enrollment(organization_id=orgs[0].id, offering_id=offs[0].id, student_id=students[0].id))
        db.commit()
        yield {"factory": factory, "orgs": orgs, "users": users, "courses": courses, "students": students, "offs": offs}


def client_for(world: dict, user_index: int, roles: frozenset = frozenset({Role.STUDENT})) -> TestClient:
    app = create_app()
    user, org = world["users"][user_index], world["orgs"][user_index]

    def _db() -> Iterator[Session]:
        with world["factory"]() as s:
            yield s

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_principal] = lambda: Principal(user.id, org.id, roles)
    return TestClient(app)


def body(course_id, event_id=None, **over) -> dict:
    data = {"event_id": str(event_id or uuid4()), "event_type": "lesson_viewed", "course_id": str(course_id),
            "occurred_at": datetime.now(UTC).isoformat(), "duration_seconds": 30}
    data.update(over)
    return data


def test_event_is_idempotent(world) -> None:
    c = client_for(world, 0)
    payload = body(world["courses"][0].id)
    assert c.post("/api/v1/learning-events", json=payload).status_code == 201
    again = c.post("/api/v1/learning-events", json=payload)
    assert again.status_code == 200 and again.json()["status"] == "duplicate"


def test_cannot_post_event_to_other_organization_course(world) -> None:
    c = client_for(world, 0)
    r = c.post("/api/v1/learning-events", json=body(world["courses"][1].id))
    assert r.status_code == 403


def test_client_cannot_spoof_organization(world) -> None:
    c = client_for(world, 0)
    r = c.post("/api/v1/learning-events", json=body(world["courses"][0].id, organization_id=str(world["orgs"][1].id)))
    assert r.status_code == 422


def test_unenrolled_student_rejected(world) -> None:
    c = client_for(world, 1)  # estudiante de B: existe, pero sin matrícula activa
    assert c.post("/api/v1/learning-events", json=body(world["courses"][1].id)).status_code == 403


def test_database_blocks_cross_tenant_reference(world) -> None:
    """La FK compuesta rechaza una matrícula de A apuntando a una oferta de B aunque la app fallara."""
    with world["factory"]() as db, pytest.raises(IntegrityError):
        db.add(Enrollment(organization_id=world["orgs"][0].id, offering_id=world["offs"][1].id,
                          student_id=world["students"][0].id))
        db.commit()


def test_student_lists_only_own_enrolled_courses(world) -> None:
    items = client_for(world, 0).get("/api/v1/courses").json()["items"]
    assert [i["id"] for i in items] == [str(world["courses"][0].id)]


ADMIN = frozenset({Role.INSTITUTION_ADMIN})


def test_admin_enrolls_then_duplicate_then_withdraw_and_reactivate(world) -> None:
    # estudiante nuevo en A
    with world["factory"]() as db:
        u = User(organization_id=world["orgs"][0].id, email="n@A", email_normalized="n@A", full_name="n", status="active")
        db.add(u); db.flush()
        st = Student(organization_id=world["orgs"][0].id, user_id=u.id)
        db.add(st); db.commit()
        student_id = st.id
    admin = client_for(world, 0, ADMIN)
    url = f"/api/v1/offerings/{world['offs'][0].id}/enrollments"
    first = admin.post(url, json={"student_id": str(student_id)})
    assert first.status_code == 201
    assert admin.post(url, json={"student_id": str(student_id)}).status_code == 409
    enrollment_id = first.json()["id"]
    assert admin.post(f"/api/v1/enrollments/{enrollment_id}/withdraw").json()["status"] == "withdrawn"
    assert admin.post(f"/api/v1/enrollments/{enrollment_id}/withdraw").status_code == 409
    again = admin.post(url, json={"student_id": str(student_id)})
    assert again.status_code == 200 and again.json()["status"] == "active"


def test_admin_cannot_touch_other_organization(world) -> None:
    admin_a = client_for(world, 0, ADMIN)
    r = admin_a.post(f"/api/v1/offerings/{world['offs'][1].id}/enrollments", json={"student_id": str(world["students"][1].id)})
    assert r.status_code == 404  # no revela si existe en otra institución


def test_student_cannot_enroll_or_create_courses(world) -> None:
    c = client_for(world, 0)
    assert c.post(f"/api/v1/offerings/{world['offs'][0].id}/enrollments", json={"student_id": str(world["students"][0].id)}).status_code == 403
    assert c.post("/api/v1/courses", json={"code": "X", "title": "t", "level": "l"}).status_code == 403


def test_duplicate_course_code_is_409_and_mutations_are_audited(world) -> None:
    admin = client_for(world, 0, ADMIN)
    assert admin.post("/api/v1/courses", json={"code": "NEW", "title": "t", "level": "l"}).status_code == 201
    assert admin.post("/api/v1/courses", json={"code": "NEW", "title": "t", "level": "l"}).status_code == 409
    actions = [i["action"] for i in admin.get("/api/v1/audit-logs").json()["items"]]
    assert actions.count("course.created") == 1  # el intento fallido no deja rastro de éxito


def test_audit_log_rejects_update_and_delete(world) -> None:
    admin = client_for(world, 0, ADMIN)
    admin.post("/api/v1/courses", json={"code": "AUD", "title": "t", "level": "l"})
    with world["factory"]() as db:
        with pytest.raises(Exception):  # noqa: B017  (el trigger lanza ProgrammingError/InternalError según driver)
            db.execute(text("update audit_logs set action = 'x'"))
        db.rollback()
        with pytest.raises(Exception):  # noqa: B017
            db.execute(text("delete from audit_logs"))
        db.rollback()
        assert db.query(AuditLog).count() >= 1


def test_student_sees_only_own_audit_and_never_other_org(world) -> None:
    client_for(world, 0, ADMIN).post("/api/v1/courses", json={"code": "Z1", "title": "t", "level": "l"})
    client_for(world, 1, frozenset({Role.INSTITUTION_ADMIN})).post("/api/v1/courses", json={"code": "Z2", "title": "t", "level": "l"})
    own = client_for(world, 0).get("/api/v1/audit-logs").json()["items"]
    assert all(i["actor_id"] == str(world["users"][0].id) for i in own)
    org_a_codes = client_for(world, 0, ADMIN).get("/api/v1/audit-logs").json()["items"]
    assert all(i["actor_id"] != str(world["users"][1].id) for i in org_a_codes)


# ---------------------------- evaluaciones ----------------------------
from datetime import timedelta  # noqa: E402

from app.modules.academic.models import Instructor  # noqa: E402

KEY_BODY = {
    "title": "Quiz 1", "type": "multiple_choice", "max_attempts": 2, "grading_policy": "best",
    "answer_key": {"q1": {"correct": "b", "points": "2"}, "q2": {"correct": "c", "points": "3"}},
}
INSTRUCTOR = frozenset({Role.INSTRUCTOR})


def published_quiz(world, **over) -> str:
    admin = client_for(world, 0, ADMIN)
    created = admin.post(f"/api/v1/courses/{world['courses'][0].id}/assessments", json={**KEY_BODY, **over})
    assert created.status_code == 201, created.text
    assert "answer_key" not in created.json()  # la llave nunca sale por la API
    aid = created.json()["id"]
    assert admin.post(f"/api/v1/assessments/{aid}/publish").status_code == 200
    return aid


def test_objective_attempt_is_autograded_with_official_score(world) -> None:
    aid = published_quiz(world)
    student = client_for(world, 0)
    r = student.post(f"/api/v1/assessments/{aid}/attempts", json={"answers": {"q1": "b", "q2": "x"}})
    assert r.status_code == 201 and r.json()["score"] == "2.00" and r.json()["status"] == "graded"
    r2 = student.post(f"/api/v1/assessments/{aid}/attempts", json={"answers": {"q1": "b", "q2": "c"}})
    assert r2.json()["attempt_number"] == 2
    assert student.post(f"/api/v1/assessments/{aid}/attempts", json={"answers": {}}).status_code == 409  # sin intentos
    result = student.get(f"/api/v1/assessments/{aid}/results/me").json()
    assert result["official_score"] == "5.00" and result["grading_policy"] == "best"


def test_unpublished_and_unenrolled_cannot_submit(world) -> None:
    admin = client_for(world, 0, ADMIN)
    draft = admin.post(f"/api/v1/courses/{world['courses'][0].id}/assessments", json=KEY_BODY).json()["id"]
    assert client_for(world, 0).post(f"/api/v1/assessments/{draft}/attempts", json={"answers": {}}).status_code == 409
    aid = published_quiz(world)
    assert client_for(world, 1).post(f"/api/v1/assessments/{aid}/attempts", json={"answers": {}}).status_code == 404  # otra institución


def test_late_submission_rules(world) -> None:
    past = (datetime.now(UTC) - timedelta(days=1)).isoformat()
    strict = published_quiz(world, due_at=past)
    assert client_for(world, 0).post(f"/api/v1/assessments/{strict}/attempts", json={"answers": {}}).status_code == 409
    lenient = published_quiz(world, due_at=past, allow_late=True)
    r = client_for(world, 0).post(f"/api/v1/assessments/{lenient}/attempts", json={"answers": {}})
    assert r.status_code == 201 and r.json()["is_late"] is True


def test_unknown_question_is_rejected(world) -> None:
    aid = published_quiz(world)
    assert client_for(world, 0).post(f"/api/v1/assessments/{aid}/attempts", json={"answers": {"zzz": "b"}}).status_code == 422


def test_student_cannot_create_assessments_and_key_is_validated(world) -> None:
    assert client_for(world, 0).post(f"/api/v1/courses/{world['courses'][0].id}/assessments", json=KEY_BODY).status_code == 403
    bad = {**KEY_BODY, "max_score": "99"}
    assert client_for(world, 0, ADMIN).post(f"/api/v1/courses/{world['courses'][0].id}/assessments", json=bad).status_code == 422
    assert client_for(world, 0, ADMIN).post(f"/api/v1/courses/{world['courses'][0].id}/assessments",
                                            json={**KEY_BODY, "type": "file"}).status_code == 422  # 'file' aún no soportado


def test_instructor_only_manages_assigned_courses_and_grades_manual_work(world) -> None:
    with world["factory"]() as db:
        inst = Instructor(organization_id=world["orgs"][0].id, user_id=world["users"][0].id)
        db.add(inst); db.flush()
        # sin oferta asignada todavía: no puede crear evaluaciones
    teacher = client_for(world, 0, INSTRUCTOR)
    url = f"/api/v1/courses/{world['courses'][0].id}/assessments"
    manual = {"title": "Ensayo", "type": "short_answer", "max_score": "20"}
    assert teacher.post(url, json=manual).status_code == 403
    with world["factory"]() as db:
        inst = db.query(Instructor).filter_by(user_id=world["users"][0].id).one_or_none()
        if inst is None:
            inst = Instructor(organization_id=world["orgs"][0].id, user_id=world["users"][0].id)
            db.add(inst); db.flush()
        db.get(CourseOffering, world["offs"][0].id).instructor_id = inst.id
        db.commit()
    created = teacher.post(url, json=manual)
    assert created.status_code == 201
    aid = created.json()["id"]
    assert teacher.post(f"/api/v1/assessments/{aid}/publish").status_code == 200
    attempt = client_for(world, 0).post(f"/api/v1/assessments/{aid}/attempts", json={"answers": {"essay": "texto"}}).json()
    assert attempt["status"] == "submitted" and attempt["score"] is None
    assert teacher.post(f"/api/v1/attempts/{attempt['id']}/grade", json={"score": "25"}).status_code == 422  # > max
    ok = teacher.post(f"/api/v1/attempts/{attempt['id']}/grade", json={"score": "18", "feedback": "bien"})
    assert ok.status_code == 200 and ok.json()["score"] == "18.00"
    assert teacher.post(f"/api/v1/attempts/{attempt['id']}/grade", json={"score": "20"}).status_code == 409  # no se sobrescribe
