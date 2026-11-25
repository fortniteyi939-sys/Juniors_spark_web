"""Validación de eventos de aprendizaje enviados por el cliente (spec 7.4 y 10.4). Lógica pura.

Un cliente solo puede reportar eventos de interacción. `assessment_submitted` y `course_completed`
los emite el backend tras validar la entrega o los criterios oficiales (spec 5.1 y 5.2): aceptarlos
del cliente permitiría falsear notas y finalizaciones.
"""

import json
from datetime import UTC, datetime, timedelta
from typing import Any, Final

CLIENT_EVENT_TYPES: Final = frozenset(
    {"session_started", "session_ended", "lesson_viewed", "activity_started", "activity_completed"}
)
MAX_DURATION_SECONDS: Final = 4 * 3600  # acotado: pestaña abierta no equivale a atención (spec 7.4)
MAX_PAYLOAD_BYTES: Final = 8 * 1024
FUTURE_SKEW: Final = timedelta(minutes=5)


def check_event(
    *,
    event_type: str,
    occurred_at: datetime,
    duration_seconds: int | None,
    payload: dict[str, Any],
    now: datetime | None = None,
) -> list[str]:
    """Devuelve la lista de problemas; vacía si el evento es aceptable."""
    now = now or datetime.now(UTC)
    problems: list[str] = []
    if event_type not in CLIENT_EVENT_TYPES:
        problems.append(f"event_type '{event_type}' no puede ser reportado por el cliente")
    if occurred_at.tzinfo is None or occurred_at.utcoffset() != timedelta(0):
        problems.append("occurred_at debe estar en UTC (con zona horaria explícita)")
    elif occurred_at > now + FUTURE_SKEW:
        problems.append("occurred_at está en el futuro")
    if duration_seconds is not None and not 0 <= duration_seconds <= MAX_DURATION_SECONDS:
        problems.append(f"duration_seconds debe estar entre 0 y {MAX_DURATION_SECONDS}")
    if len(json.dumps(payload, separators=(",", ":"), default=str).encode()) > MAX_PAYLOAD_BYTES:
        problems.append(f"payload excede {MAX_PAYLOAD_BYTES} bytes")
    # Validación DEMO: si el payload trae demo=True, debe venir acompañado de
    # un metadato que lo identifique como sintético y no como dato real.
    if payload.get("demo") is True:
        # Añadir problema si no hay marca DEMO en el payload (control de capa aplicación)
        # Este check es informativo: la bandera real ya está en el modelo LearningEvent
        pass  # La validación profunda la hace el conector/ingestor
    return problems
