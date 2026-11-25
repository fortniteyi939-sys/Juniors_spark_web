from typing import Any
from uuid import UUID

from fastapi import Request
from sqlalchemy.orm import Session

from app.modules.audit.models import AuditLog
from app.modules.identity.permissions import Principal


def record(
    db: Session,
    principal: Principal,
    request: Request,
    *,
    action: str,
    resource: str,
    resource_id: UUID | None,
    details: dict[str, Any] | None = None,
) -> None:
    """Agrega la entrada a la sesión actual: se confirma o revierte junto con el cambio auditado."""
    db.add(
        AuditLog(
            organization_id=principal.organization_id,
            actor_id=principal.user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            correlation_id=str(request.state.correlation_id),
            details=details or {},
        )
    )
