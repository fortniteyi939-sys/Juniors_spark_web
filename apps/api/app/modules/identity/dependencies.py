from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.modules.identity.models import User
from app.modules.identity.permissions import Principal, Role, authorize
from app.modules.identity.tokens import OidcVerifier, TokenVerifier

_bearer = HTTPBearer(auto_error=False)
_UNAUTHORIZED = {"WWW-Authenticate": "Bearer"}


def get_token_verifier() -> TokenVerifier:
    return OidcVerifier(get_settings())


def get_principal(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    verifier: Annotated[TokenVerifier, Depends(get_token_verifier)],
    db: Annotated[Session, Depends(get_db)],
) -> Principal:
    if creds is None:
        raise HTTPException(status_code=401, detail="Autenticación requerida.", headers=_UNAUTHORIZED)
    subject = verifier.subject(creds.credentials)
    user = db.scalar(select(User).where(User.idp_subject == subject))
    # Institución y roles salen de la base de datos, no del token: un claim no puede cambiar de tenant.
    if user is None or user.status != "active":
        raise HTTPException(status_code=403, detail="Usuario no autorizado.")
    roles = frozenset(Role(ur.role.code) for ur in user.roles)
    return Principal(user_id=user.id, organization_id=user.organization_id, roles=roles)


def require(permission: str) -> Callable[..., Principal]:
    """Dependencia para rutas con recurso de la propia institución del actor.
    Para rutas con {organization_id} u otro dueño, llamar a authorize() con esos datos."""

    def dependency(principal: Annotated[Principal, Depends(get_principal)]) -> Principal:
        if not authorize(principal, permission, organization_id=principal.organization_id):
            raise HTTPException(status_code=403, detail="Permiso insuficiente.")
        return principal

    return dependency


def ensure(principal: Principal, permission: str, *, organization_id: UUID, owner_user_id: UUID | None = None) -> None:
    if not authorize(principal, permission, organization_id=organization_id, owner_user_id=owner_user_id):
        raise HTTPException(status_code=403, detail="Permiso insuficiente.")
