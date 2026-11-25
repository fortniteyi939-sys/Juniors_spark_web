from uuid import uuid4

from app.modules.identity.permissions import ROLE_PERMISSIONS, Principal, Role, authorize

ORG_A, ORG_B = uuid4(), uuid4()


def who(*roles: Role, org=ORG_A) -> Principal:
    return Principal(user_id=uuid4(), organization_id=org, roles=frozenset(roles))


def test_no_roles_means_denied() -> None:
    assert not authorize(who(), "audit:read", organization_id=ORG_A)


def test_unknown_permission_is_denied() -> None:
    assert not authorize(who(Role.INSTITUTION_ADMIN), "inventado:todo", organization_id=ORG_A)


def test_tenant_isolation_blocks_other_organization() -> None:
    admin = who(Role.INSTITUTION_ADMIN)
    assert authorize(admin, "users:manage", organization_id=ORG_A)
    assert not authorize(admin, "users:manage", organization_id=ORG_B)


def test_superadmin_is_cross_tenant() -> None:
    assert authorize(who(Role.SUPERADMIN), "anything", organization_id=ORG_B)


def test_own_scope_requires_ownership() -> None:
    student = who(Role.STUDENT)
    assert authorize(student, "grades:read_own", organization_id=ORG_A, owner_user_id=student.user_id)
    assert not authorize(student, "grades:read_own", organization_id=ORG_A, owner_user_id=uuid4())
    assert not authorize(student, "grades:read_own", organization_id=ORG_A)  # sin dueño: denegado


def test_student_cannot_manage_users_or_read_all_grades() -> None:
    s = who(Role.STUDENT)
    assert not authorize(s, "users:manage", organization_id=ORG_A)
    assert not authorize(s, "grades:read_all", organization_id=ORG_A)


def test_ml_engineer_has_no_user_access_by_default() -> None:
    perms = ROLE_PERMISSIONS[Role.ML_ENGINEER]
    assert not any(p.startswith("users:") for p in perms)


def test_auditor_is_read_only() -> None:
    assert all(p.endswith(":read") for p in ROLE_PERMISSIONS[Role.AUDITOR])


def test_every_role_is_in_the_matrix() -> None:
    assert set(ROLE_PERMISSIONS) == set(Role)


def test_roles_combine_additively() -> None:
    both = who(Role.STUDENT, Role.AUDITOR)
    assert authorize(both, "audit:read", organization_id=ORG_A)


def test_migration_seed_matches_role_enum() -> None:
    import importlib.util
    import pathlib

    path = pathlib.Path(__file__).parents[2] / "migrations" / "versions" / "0001_identity.py"
    spec = importlib.util.spec_from_file_location("m0001", path)
    assert spec and spec.loader
    src = path.read_text()
    for role in Role:
        assert f'"{role.value}"' in src
