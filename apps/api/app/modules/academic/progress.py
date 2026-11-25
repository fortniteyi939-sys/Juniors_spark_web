def completion_ratio(completed: int, required: int) -> float | None:
    """completion_ratio = actividades completadas / requeridas, en [0,1] (spec 8.3).
    Sin actividades requeridas no hay ratio calculable: None, no 0 ni 1."""
    if completed < 0 or required < 0:
        raise ValueError("los conteos no pueden ser negativos")
    if required == 0:
        return None
    return min(completed / required, 1.0)
