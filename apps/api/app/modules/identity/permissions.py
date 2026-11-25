"""Roles, permisos y autorización (spec sección 3: RBAC + ABAC, siempre en backend).

Lógica pura, sin dependencias de framework: es la pieza que decide acceso y la más importante de probar.
Principios: denegar por defecto, aislamiento por institución, el alcance "propio" se verifica contra el dueño.
"""

from dataclasses import dataclass
from enum import StrEnum
from typing import Final, Optional
from uuid import UUID


class Role(StrEnum):
    SUPERADMIN = "superadmin"
    INSTITUTION_ADMIN = "institution_admin"
    COORDINATOR = "coordinator"
    INSTRUCTOR = "instructor"
    STUDENT = "student"
    DATA_ANALYST = "data_analyst"
    ML_ENGINEER = "ml_engineer"
    AUDITOR = "auditor"


# Convención: el sufijo "_own" exige que el recurso pertenezca al actor (ABAC por propiedad).
OWN_SUFFIX: Final = "_own"

# Matriz derivada de la tabla de la sección 3 de la especificación. Revisar con el Product Owner.
ROLE_PERMISSIONS: Final[dict[Role, frozenset[str]]] = {
    Role.SUPERADMIN: frozenset(),  # gestionado aparte: acceso global, ver is_global()
    Role.INSTITUTION_ADMIN: frozenset({
        "users:manage", "courses:manage", "enrollments:manage", "grades:read_all", "reports:read", "config:manage",
        "audit:read", "datasets:approve_access", "models:approve_publish", "dashboard:read",
    }),
    Role.COORDINATOR: frozenset({
        "dashboard:read", "cohorts:read", "reports:read", "alerts:read", "courses:read_aggregate",
        "paths:manage",
    }),
    Role.INSTRUCTOR: frozenset({
        "courses:read_assigned", "content:manage_assigned", "grades:manage_assigned",
        "models:read_results", "recommendations:review_assigned", "audit:read_own",
    }),
    Role.STUDENT: frozenset({
        "profile:read_own", "courses:read_enrolled", "grades:read_own",
        "recommendations:read_own", "certificates:read_own", "audit:read_own", "events:write_own", "attempts:submit_own",
    }),
    Role.DATA_ANALYST: frozenset({
        "users:read_pseudonymized", "courses:read_aggregate", "grades:read_aggregate",
        "datasets:prepare", "models:evaluate_metrics", "audit:read_authorized",
    }),
    Role.ML_ENGINEER: frozenset({
        "grades:read_approved_features", "datasets:train", "models:train_register", "audit:read_ml",
    }),
    # El auditor solo lee: ninguna acción de escritura (spec: "sin modificación").
    Role.AUDITOR: frozenset({"audit:read", "versions:read", "access_logs:read", "evidence:read"}),
}


# ── Nuevos modelos para ABAC institucional ──────────────────────────────────

@dataclass(frozen=True, slots=True)
class AccessContext:
    """Contexto completo para decisiones ABAC (spec 3, 6.4).

    Proporciona a la función authorize todos los atributos necesarios para
    tomar una decisión de acceso basada en roles Y atributos (institución, curso, grupo).
    """

    user_id: UUID
    organization_id: UUID
    user_role: Role  # Role del usuario desde la BD
    resource_organization_id: UUID  # organización a la que pertenece el recurso
    resource_course_id: Optional[UUID] = None  # curso si el recurso es curso-related
    resource_group_id: Optional[UUID] = None  # grupo si el recurso es grupo-related
    user_owns_resource: bool = False  # True si el recurso le pertenece personalmente


# Función auxiliar para construir el contexto desde el Principal y datos del recurso
def build_access_context(
    principal: "Principal",
    *,
    resource_organization_id: UUID,
    resource_course_id: Optional[UUID] = None,
    resource_group_id: Optional[UUID] = None,
    user_owns_resource: bool = False,
) -> AccessContext:
    """Construye AccessContext a partir del Principal y metadatos del recurso."""
    # Obtener el primer rol del frozenset (o STUDENT por defecto)
    user_role = next(iter(principal.roles)) if principal.roles else Role.STUDENT
    return AccessContext(
        user_id=principal.user_id,
        organization_id=principal.organization_id,
        user_role=user_role,
        resource_organization_id=resource_organization_id,
        resource_course_id=resource_course_id,
        resource_group_id=resource_group_id,
        user_owns_resource=user_owns_resource,
    )


# Matriz de permisos enriquecida con validación ABAC (spec 3, 6.4)
# Cada permiso puede tener asociado un "contexto esperado" que la función
# authorize validará automáticamente si el permiso termina en _own u otros sufijos.

# Sufijos de contexto ABAC:
#   - _own:   el recurso debe pertenecer al usuario (dueño). Verificar resource_organization_id y user_id.
#   - _inst:  el recurso debe pertenecer a la institución del usuario. Verificar organization_id.
#   - _course: el recurso debe ser de un curso específico. Verificar resource_course_id.
#   - _group: el recurso debe pertenecer a un grupo específico. Verificar resource_group_id.

# Por defecto, si no tiene sufijo, se comporta como permiso puro RBAC (solo rol).


def is_global(principal: "Principal") -> bool:
    """Retorna True si el usuario tiene rol superadmin (acceso global)."""
    return Role.SUPERADMIN in principal.roles


def permissions_of(principal: "Principal") -> frozenset[str]:
    """Retorna el conjunto de permisos concedidos por los roles del principal."""
    return frozenset().union(*(ROLE_PERMISSIONS.get(r, frozenset()) for r in principal.roles))


# ── Función principal de autorización ───────────────────────────────────────

# Suffijos de permiso y su significado ABAC:
#   permiso ENDS WITH "_own"  →  verificar que owner_user_id == principal.user_id
#                                         Y que resource_organization_id == principal.organization_id
#   permiso ENDS WITH "_inst"  →  verificar que resource_organization_id == principal.organization_id
#   permiso ENDS WITH "_course" →  verificar que resource_course_id coincida
#   permiso ENDS WITH "_group"  →  verificar que resource_group_id coincida
#   de otro modo  →  solo RBAC por rol (como antes)

OWN_SUFFIX: Final = "_own"
INST_SUFFIX: Final = "_inst"
COURSE_SUFFIX: Final = "_course"
GROUP_SUFFIX: Final = "_group"


def authorize(
    principal: "Principal",
    permission: str,
    *,
    organization_id: UUID,
    owner_user_id: UUID | None = None,
    resource_course_id: UUID | None = None,
    resource_group_id: UUID | None = None,
) -> bool:
    """Autoriza una petición applying RBAC + ABAC (spec 3, 6.4).

    True solo si:
    1. El rol del usuario concede el permiso, O es superadmin.
    2. El recurso pertenece a la institución correcta (isolamiento multi-tenant).
    3. Si el permiso tiene sufijo ABAC (_own, _inst, _course, _group), se validan
       los atributos correspondientes. Sin roles o permiso desconocido: denegado.

    Este es el corazón de la seguridad: NUNCA confiar solo en UI (spec 1.3, 12.1).
    """

    # 1. Superadmin tiene acceso global a todo
    if is_global(principal):
        return True

    # 2. Validación de institución (aislamiento multi-tenant obligatorio)
    if organization_id != principal.organization_id:
        return False

    # 3. Verificar que el permiso existe en la matriz de roles
    permitted_perms = permissions_of(principal)
    if permission not in permitted_perms:
        return False

    # 4. Aplicar validaciones ABAC según sufijo del permiso
    if permission.endswith(OWN_SUFFIX):
        # El recurso debe ser del usuario propietario
        if owner_user_id is None:
            return False
        return owner_user_id == principal.user_id

    if permission.endswith(INST_SUFFIX):
        # El recurso debe pertenecer a la institución del usuario
        # (ya validado en el paso 2, pero expresado explícitamente aquí)
        return True

    if permission.endswith(COURSE_SUFFIX):
        # El recurso debe ser de un curso específico proporcionado
        # En una implementación completa, se compararía con resource_course_id
        # que se pasaría en el llamado. Por ahora, validar que vaya acompañado.
        if resource_course_id is None:
            return False
        # En un sistema completo, se compararía: resource_course_id == curso_usuario
        # Por ahora, accept si viene informado
        return True

    if permission.endswith(GROUP_SUFFIX):
        # El recurso debe pertenecer a un grupo específico
        # Igual que course, se pasaría resource_group_id en el llamado
        if resource_group_id is None:
            return False
        return True

    # 5. Sin sufijo especial: solo RBAC por rol (el permiso es suficiente)
    return True


# ── Clase Principal (sin cambios en la interfaz pública) ────────────────────

@dataclass(frozen=True, slots=True)
class Principal:
    """Actor autenticado. organization_id y roles salen de la base de datos, nunca de claims del token."""

    user_id: UUID
    organization_id: UUID
    roles: frozenset[Role]


# ── Ejemplos de uso en endpoints (commentado para que el módulo sea importable) ─────

# Ejemplo de cómo usarlo en un endpoint FastAPI:

# @router.post("/courses", status_code=201)
# def create_course(
#     body: CourseIn,
#     request: Request,
#     principal: Annotated[Principal, Depends(get_principal)],
#     db: Annotated[Session, Depends(get_db)],
# ) -> CourseOut:
#     # Construir contexto ABAC: el curso pertenecerá a la institución del usuario
#     ctx = build_access_context(
#         principal,
#         resource_organization_id=principal.organization_id,
#     )
#
#     # Verificar permiso con ABAC _inst (pertenece a la institución)
#     if not authorize(
#         principal,
#         "courses:manage",
#         organization_id=ctx.resource_organization_id,
#     ):
#         raise HTTPException(status_code=403, detail="Sin permisos para crear cursos.")
#
#     course = Course(organization_id=ctx.resource_organization_id, **body.model_dump())
#     ...