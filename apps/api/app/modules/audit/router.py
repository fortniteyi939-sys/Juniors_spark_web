from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, tuple_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.audit.models import AuditLog
from app.modules.identity.dependencies import get_principal
from app.modules.identity.permissions import Principal, is_global, permissions_of

router = APIRouter(tags=["audit"])


class AuditOut(BaseModel):
    id: UUID
    actor_id: UUID
    action: str
    resource: str
    resource_id: UUID | None
    occurred_at: datetime
    correlation_id: str


class AuditPage(BaseModel):
    items: list[AuditOut]
    next_cursor: UUID | None


@router.get("/audit-logs")
def list_audit_logs(
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    after: UUID | None = None,
) -> AuditPage:
    """Auditoría según rol (spec 10.1): administración y auditor ven la institución; docente y estudiante,
    solo su propia actividad. Otros roles (analista, ML) quedan sin acceso hasta definir su alcance."""
    perms = permissions_of(principal)
    stmt = select(AuditLog).where(AuditLog.organization_id == principal.organization_id)
    if is_global(principal) or "audit:read" in perms:
        pass
    elif "audit:read_own" in perms:
        stmt = stmt.where(AuditLog.actor_id == principal.user_id)
    else:
        raise HTTPException(status_code=403, detail="Permiso insuficiente.")

    if after is not None:
        cursor = db.scalar(stmt.where(AuditLog.id == after))  # el cursor debe estar dentro del alcance visible
        if cursor is None:
            raise HTTPException(status_code=422, detail="Cursor inválido.")
        stmt = stmt.where(tuple_(AuditLog.occurred_at, AuditLog.id) < tuple_(cursor.occurred_at, cursor.id))

    rows = list(db.scalars(stmt.order_by(AuditLog.occurred_at.desc(), AuditLog.id.desc()).limit(limit + 1)))
    page, more = rows[:limit], len(rows) > limit
    return AuditPage(
        items=[AuditOut.model_validate(r, from_attributes=True) for r in page],
        next_cursor=page[-1].id if more else None,
    )
