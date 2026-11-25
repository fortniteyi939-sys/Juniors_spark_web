from fastapi.testclient import TestClient

from app.main import create_app

client = TestClient(create_app(), raise_server_exceptions=False)


def test_live_and_ready() -> None:
    assert client.get("/health/live").json() == {"status": "ok"}
    assert client.get("/health/ready").status_code == 200


def test_correlation_id_is_generated_and_echoed() -> None:
    generated = client.get("/api/v1/meta").headers["X-Correlation-ID"]
    assert len(generated) >= 8
    echoed = client.get("/api/v1/meta", headers={"X-Correlation-ID": "abc-12345678"})
    assert echoed.headers["X-Correlation-ID"] == "abc-12345678"


def test_invalid_correlation_id_is_replaced() -> None:
    r = client.get("/api/v1/meta", headers={"X-Correlation-ID": "bad value!"})
    assert r.headers["X-Correlation-ID"] != "bad value!"


def test_not_found_uses_normalized_error() -> None:
    r = client.get("/api/v1/no-existe")
    body = r.json()
    assert r.status_code == 404
    assert set(body) == {"code", "message", "details", "correlation_id"}
    assert body["correlation_id"] == r.headers["X-Correlation-ID"]
