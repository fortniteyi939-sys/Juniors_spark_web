"""Validación de tokens OIDC. Falla cerrada: sin configuración o con token inválido, no hay acceso."""

from typing import Protocol

import jwt
from fastapi import HTTPException

from app.core.config import Settings


class TokenVerifier(Protocol):
    def subject(self, token: str) -> str: ...


class OidcVerifier:
    def __init__(self, settings: Settings) -> None:
        if not (settings.oidc_issuer and settings.oidc_audience and settings.oidc_jwks_url):
            raise HTTPException(status_code=503, detail="Autenticación no configurada.")
        self._issuer = settings.oidc_issuer
        self._audience = settings.oidc_audience
        self._jwks = jwt.PyJWKClient(settings.oidc_jwks_url)

    def subject(self, token: str) -> str:
        try:
            key = self._jwks.get_signing_key_from_jwt(token).key
            claims = jwt.decode(
                token,
                key,
                algorithms=["RS256", "ES256"],  # lista cerrada: nunca "none" ni HS*
                issuer=self._issuer,
                audience=self._audience,
                options={"require": ["exp", "iss", "aud", "sub"]},
            )
        except jwt.PyJWTError as exc:
            raise HTTPException(
                status_code=401, detail="Token inválido o expirado.", headers={"WWW-Authenticate": "Bearer"}
            ) from exc
        return str(claims["sub"])
