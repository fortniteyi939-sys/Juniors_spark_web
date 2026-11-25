from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException


class ErrorBody(BaseModel):
    """Error normalizado (spec 10.1): code, message, details, correlation_id."""

    code: str
    message: str
    details: list[dict[str, object]] = []
    correlation_id: str


def _correlation_id(request: Request) -> str:
    return str(getattr(request.state, "correlation_id", ""))


def _response(
    request: Request,
    status: int,
    code: str,
    message: str,
    details: list[dict[str, object]],
    headers: dict[str, str] | None = None,
):
    body = ErrorBody(code=code, message=message, details=details, correlation_id=_correlation_id(request))
    return JSONResponse(status_code=status, content=body.model_dump(), headers=headers)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_error(request: Request, exc: StarletteHTTPException):
        return _response(
            request, exc.status_code, f"http_{exc.status_code}", str(exc.detail), [], dict(exc.headers or {})
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        details: list[dict[str, object]] = [
            {"loc": [str(p) for p in e["loc"]], "msg": e["msg"], "type": e["type"]} for e in exc.errors()
        ]
        return _response(request, 422, "validation_error", "La solicitud no es válida.", details)

    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception):
        # Mensaje seguro: el detalle va a los logs, no al cliente (spec 10.4, estado Error).
        return _response(request, 500, "internal_error", "Error interno. Indique el correlation_id al soporte.", [])
