# Decisiones de arquitectura (registro)

## ADR-001: Multiinstitución desde el primer día — SUPUESTO, pendiente de confirmar
La especificación (17.1) deja abierta esta decisión al Product Owner. Se asume multiinstitución porque
añadir `organization_id` y el aislamiento después es costoso. Una sola institución es una fila en `organizations`.
Si el PO decide lo contrario, el coste de mantener el aislamiento es bajo.

## ADR-002: Institución y roles salen de la base de datos, no del token
El token solo aporta `sub`. Evita que un claim manipulado o mal configurado en el proveedor cambie de tenant.

## ADR-003: Autorización denegar-por-defecto en lógica pura
`app/modules/identity/permissions.py` no depende del framework y tiene pruebas propias.
La matriz de permisos se derivó de la tabla de la sección 3 y debe ser validada por el PO.

## Pendiente
- Row Level Security en PostgreSQL (spec 11). Exige resolver cómo se busca al usuario por `idp_subject` antes de
  conocer su institución (consulta privilegiada o política específica) y un rol de BD sin BYPASSRLS.
- Proveedor OIDC concreto (config `EDUMASTER_OIDC_*`); mientras no se configure, la API responde 503 en rutas autenticadas.
- Auditoría de acciones de identidad (spec 12.1).

## ADR-004: Depuración del repositorio (2026-11-25)
Se retiró lo que no está respaldado por la especificación o rompía su Definition of Done:
- `apps/api/app/modules/recommendations`: endpoints sin autenticación (spec 3/13.3), estado en memoria sin migración, candidatos
  fijos con un nombre de modelo inexistente (spec 9.7/5.4) y rutas distintas a las de 10.1. Se reconstruye en la fase 6, con
  `GET /api/v1/recommendations` y `POST /api/v1/recommendations/{id}/feedback`, tras tener dataset y baseline.
- `apps/web`: `components/Sidebar.tsx`, `modules/icons.tsx` y los bloques `*ModuleMeta` (duplicaban `app/layouts/Sidebar.tsx`,
  no se usaban y dependían de `lucide-react`, que no está instalado).
- Cachés `__pycache__` y `.gitkeep` en carpetas que ya tienen contenido.
## Pendiente detectado
- `learning_events` (tracking) tiene modelo pero no migración: falta `0005_tracking.py`.

## ADR-005: Marca Junior's Sparks y barra lateral según tema (2026-11-25)
Se reemplaza el logo de EduMaster por el de Junior's Sparks, con una versión para tema claro y otra para oscuro
(`apps/web/src/assets/brand/`). Para que el logo de fondo claro sea visible, la barra lateral deja de ser Negro Piano
en ambos temas: es clara en tema claro y oscura en tema oscuro (tokens `--sb-*` en `tokens.css`). En pantallas
angostas (< 800 px) se muestra solo el icono. Los textos "EduMaster.ai" del título de la página y del demo HTML
original no se tocaron.
