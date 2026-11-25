import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

_PK = {"primary_key": True, "server_default": text("gen_random_uuid()")}

# Integridad de tenant a nivel de BD: las claves foráneas compuestas (id, organization_id) impiden que una
# fila de una institución apunte a datos de otra, aunque falle la validación de la aplicación (spec 7.2).


class Student(Base):
    __tablename__ = "students"
    __table_args__ = (UniqueConstraint("id", "organization_id", name="uq_students_id_org"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), **_PK)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True)
    external_code: Mapped[str | None] = mapped_column(String(64))


class Instructor(Base):
    __tablename__ = "instructors"
    __table_args__ = (UniqueConstraint("id", "organization_id", name="uq_instructors_id_org"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), **_PK)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True)
    staff_code: Mapped[str | None] = mapped_column(String(64))


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        CheckConstraint("status in ('draft','published','archived')", name="ck_courses_status"),
        UniqueConstraint("organization_id", "code", name="uq_courses_org_code"),
        UniqueConstraint("id", "organization_id", name="uq_courses_id_org"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), **_PK)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    code: Mapped[str] = mapped_column(String(32))
    title: Mapped[str] = mapped_column(String(200))
    level: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(16), server_default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CourseOffering(Base):
    __tablename__ = "course_offerings"
    __table_args__ = (
        ForeignKeyConstraint(["course_id", "organization_id"], ["courses.id", "courses.organization_id"]),
        ForeignKeyConstraint(
            ["instructor_id", "organization_id"], ["instructors.id", "instructors.organization_id"]
        ),
        UniqueConstraint("id", "organization_id", name="uq_offerings_id_org"),
        CheckConstraint("ends_on is null or starts_on is null or ends_on >= starts_on", name="ck_offerings_dates"),
        Index("ix_offerings_course_period", "course_id", "period"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), **_PK)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    course_id: Mapped[uuid.UUID] = mapped_column()
    instructor_id: Mapped[uuid.UUID | None] = mapped_column()
    period: Mapped[str] = mapped_column(String(32))
    starts_on: Mapped[date | None] = mapped_column(Date)
    ends_on: Mapped[date | None] = mapped_column(Date)


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        ForeignKeyConstraint(
            ["offering_id", "organization_id"], ["course_offerings.id", "course_offerings.organization_id"]
        ),
        ForeignKeyConstraint(["student_id", "organization_id"], ["students.id", "students.organization_id"]),
        CheckConstraint("status in ('active','completed','withdrawn')", name="ck_enrollments_status"),
        UniqueConstraint("offering_id", "student_id", name="uq_enrollments_offering_student"),
        Index("ix_enrollments_student", "student_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), **_PK)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    offering_id: Mapped[uuid.UUID] = mapped_column()
    student_id: Mapped[uuid.UUID] = mapped_column()
    status: Mapped[str] = mapped_column(String(16), server_default="active")
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
