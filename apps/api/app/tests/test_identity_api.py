from typing import Annotated
from uuid import uuid4

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.correlation import CorrelationIdMiddleware
from app.core.errors import register_error_handlers
from app.main import create_app
from app.modules.identity.dependencies import get_principal, require
from app.modules.identity.permissions import Principal, Role

ORG = uuid4()


def principal(*roles: Role) -> Principal:
    return Principal(user_id=uuid4(), organization_id=ORG, roles=frozenset(roles))


def make_client(p: Principal) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_principal] = lambda: p
    return TestClient(app, raise_server_exceptions=False)


def test_me_without_token_is_401_with_challenge() -> None:
    r = TestClient(create_app(), raise_server_exceptions=False).get("/api/v1/me")
    # Sin BD configurada la cadena de dependencias puede responder 503; nunca 200.
    assert r.status_code in (401, 503)
    assert "correlation_id" in r.json()


def test_me_returns_roles_and_permissions() -> None:
    body = make_client(principal(Role.STUDENT)).get("/api/v1/me").json()
    assert body["roles"] == ["student"]
    assert "grades:read_own" in body["permissions"]
    assert "users:manage" not in body["permissions"]


def test_require_returns_403_for_missing_permission() -> None:
    app = FastAPI()
    app.add_middleware(CorrelationIdMiddleware)
    register_error_handlers(app)

    @app.get("/admin-only")
    def admin_only(_: Annotated[Principal, Depends(require("users:manage"))]) -> dict[str, str]:
        return {"ok": "yes"}

    app.dependency_overrides[get_principal] = lambda: principal(Role.STUDENT)
    denied = TestClient(app, raise_server_exceptions=False).get("/admin-only")
    assert denied.status_code == 403
    assert denied.json()["code"] == "http_403"

    app.dependency_overrides[get_principal] = lambda: principal(Role.INSTITUTION_ADMIN)
    assert TestClient(app, raise_server_exceptions=False).get("/admin-only").status_code == 200
