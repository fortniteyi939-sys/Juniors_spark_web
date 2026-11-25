"""núcleo académico y eventos de aprendizaje

Revision ID: 0002
Revises: 0001
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"

UUID = postgresql.UUID(as_uuid=True)
PK = {"primary_key": True, "server_default": sa.text("gen_random_uuid()")}
NOW = sa.func.now()


def upgrade() -> None:
    op.create_table(
        "students",
        sa.Column("id", UUID, **PK),
        sa.Column("organization_id", UUID, sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("external_code", sa.String(64)),
        sa.UniqueConstraint("id", "organization_id", name="uq_students_id_org"),
    )
    op.create_table(
        "instructors",
        sa.Column("id", UUID, **PK),
        sa.Column("organization_id", UUID, sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("staff_code", sa.String(64)),
        sa.UniqueConstraint("id", "organization_id", name="uq_instructors_id_org"),
    )
    op.create_table(
        "courses",
        sa.Column("id", UUID, **PK),
        sa.Column("organization_id", UUID, sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("level", sa.String(32), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=NOW),
        sa.CheckConstraint("status in ('draft','published','archived')", name="ck_courses_status"),
        sa.UniqueConstraint("organization_id", "code", name="uq_courses_org_code"),
        sa.UniqueConstraint("id", "organization_id", name="uq_courses_id_org"),
    )
    op.create_table(
        "course_offerings",
        sa.Column("id", UUID, **PK),
        sa.Column("organization_id", UUID, sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("course_id", UUID, nullable=False),
        sa.Column("instructor_id", UUID),
        sa.Column("period", sa.String(32), nullable=False),
        sa.Column("starts_on", sa.Date),
        sa.Column("ends_on", sa.Date),
        sa.ForeignKeyConstraint(["course_id", "organization_id"], ["courses.id", "courses.organization_id"]),
        sa.ForeignKeyConstraint(
            ["instructor_id", "organization_id"], ["instructors.id", "instructors.organization_id"]
        ),
        sa.UniqueConstraint("id", "organization_id", name="uq_offerings_id_org"),
        sa.CheckConstraint("ends_on is null or starts_on is null or ends_on >= starts_on", name="ck_offerings_dates"),
    )
    op.create_index("ix_offerings_course_period", "course_offerings", ["course_id", "period"])
    op.create_table(
        "enrollments",
        sa.Column("id", UUID, **PK),
        sa.Column("organization_id", UUID, sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("offering_id", UUID, nullable=False),
        sa.Column("student_id", UUID, nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="active"),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), nullable=False, server_default=NOW),
        sa.ForeignKeyConstraint(
            ["offering_id", "organization_id"], ["course_offerings.id", "course_offerings.organization_id"]
        ),
        sa.ForeignKeyConstraint(["student_id", "organization_id"], ["students.id", "students.organization_id"]),
        sa.CheckConstraint("status in ('active','completed','withdrawn')", name="ck_enrollments_status"),
        sa.UniqueConstraint("offering_id", "student_id", name="uq_enrollments_offering_student"),
    )
    op.create_index("ix_enrollments_student", "enrollments", ["student_id"])
    op.create_table(
        "learning_events",
        sa.Column("id", UUID, **PK),
        sa.Column("event_id", UUID, nullable=False),
        sa.Column("organization_id", UUID, sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("student_id", UUID, nullable=False),
        sa.Column("course_id", UUID, nullable=False),
        sa.Column("activity_id", UUID),
        sa.Column("event_type", sa.String(48), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False, server_default=NOW),
        sa.Column("duration_seconds", sa.Integer),
        sa.Column("payload_schema_version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("source", sa.String(16), nullable=False),
        sa.Column("correlation_id", sa.String(64), nullable=False),
        sa.Column("payload", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.ForeignKeyConstraint(["course_id", "organization_id"], ["courses.id", "courses.organization_id"]),
        sa.ForeignKeyConstraint(["student_id", "organization_id"], ["students.id", "students.organization_id"]),
        sa.UniqueConstraint("organization_id", "event_id", name="uq_events_org_event"),
        sa.CheckConstraint("duration_seconds is null or (duration_seconds between 0 and 14400)", name="ck_events_duration"),
        sa.CheckConstraint("source in ('web','mobile','import','integration')", name="ck_events_source"),
    )
    op.create_index("ix_events_org_occurred", "learning_events", ["organization_id", "occurred_at"])
    op.create_index("ix_events_student_course", "learning_events", ["student_id", "course_id"])


def downgrade() -> None:
    for table in ("learning_events", "enrollments", "course_offerings", "courses", "instructors", "students"):
        op.drop_table(table)
