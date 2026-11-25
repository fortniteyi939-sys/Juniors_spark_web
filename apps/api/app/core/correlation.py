import re
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

HEADER = "X-Correlation-ID"
_VALID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Propaga o genera el correlation_id (spec 12). Un valor entrante inválido se descarta."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        incoming = request.headers.get(HEADER, "")
        cid = incoming if _VALID.match(incoming) else str(uuid.uuid4())
        request.state.correlation_id = cid
        response = await call_next(request)
        response.headers[HEADER] = cid
        return response
