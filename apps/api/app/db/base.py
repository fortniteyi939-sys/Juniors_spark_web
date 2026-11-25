from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base declarativa. Identificadores UUID y timestamps en UTC (spec 7.2)."""
