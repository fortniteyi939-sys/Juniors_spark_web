from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import get_settings
from app.modules.academic.enrollments import router as enrollments_router
from app.modules.academic.router import router as academic_router
from app.modules.assessments.router import router as assessments_router
from app.modules.audit.router import router as audit_router
from app.modules.identity.dependencies import get_principal
from app.modules.identity.permissions import Principal, permissions_of
from app.modules.tracking.router import router as tracking_router

router = APIRouter(prefix="/api/v1")
router.include_router(academic_router)
router.include_router(enrollments_router)
router.include_router(assessments_router)
router.include_router(audit_router)
router.include_router(tracking_router)


@router.get("/meta", tags=["meta"])
def meta() -> dict[str, str]:
    """Contrato mínimo de versión; los endpoints de la sección 10.1 se añaden por dominio."""
    return {"name": "edumaster-api", "api_version": "v1", "env": get_settings().env}


class MeResponse(BaseModel):
    user_id: str
    organization_id: str
    roles: list[str]
    permissions: list[str]


@router.get("/me", tags=["identity"])
def me(principal: Annotated[Principal, Depends(get_principal)]) -> MeResponse:
    """Contexto de permisos del usuario. Solo informativo para la UI: la seguridad vive en cada endpoint."""
    return MeResponse(
        user_id=str(principal.user_id),
        organization_id=str(principal.organization_id),
        roles=sorted(r.value for r in principal.roles),
        permissions=sorted(permissions_of(principal)),
    )
