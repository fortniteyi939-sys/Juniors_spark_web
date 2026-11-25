"""evaluaciones e intentos

Revision ID: 0004
Revises: 0003
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"

UUID = postgresql.UUID(as_uuid=True)
PK = {"primary_key": True, "server_default": sa.text("gen_random_uuid()")}


def upgrade() -> None:
    op.create_table(
        "assessments",
        sa.Column("id", UUID, **PK),
        sa.Column("organization_id", UUID, sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("course_id", UUID, nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("type", sa.String(24), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="draft"),
        sa.Column("due_at", sa.DateTime(timezone=True)),
        sa.Column("max_attempts", sa.Integer, nullable=False, server_default="1"),
        sa.Column("allow_late", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("grading_policy", sa.String(8), nullable=False, server_default="best"),
        sa.Column("weight", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("max_score", sa.Numeric(6, 2), nullable=False),
        sa.Column("answer_key", postgresql.JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["course_id", "organization_id"], ["courses.id", "courses.organization_id"]),
        sa.UniqueConstraint("id", "organization_id", name="uq_assessments_id_org"),
        sa.CheckConstraint("status in ('draft','published','closed')", name="ck_assessments_status"),
        sa.CheckConstraint(
            "type in ('multiple_choice','true_false','short_answer','practice')", name="ck_assessments_type"
        ),
        sa.CheckConstraint("grading_policy in ('best','last')", name="ck_assessments_policy"),
        sa.CheckConstraint("max_attempts between 1 and 10", name="ck_assessments_attempts"),
        sa.CheckConstraint("weight between 0 and 100", name="ck_assessments_weight"),
        sa.CheckConstraint("max_score > 0", name="ck_assessments_max_score"),
    )
    op.create_index("ix_assessments_course", "assessments", ["course_id"])
    op.create_table(
        "assessment_attempts",
        sa.Column("id", UUID, **PK),
        sa.Column("organization_id", UUID, sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("assessment_id", UUID, nullable=False),
        sa.Column("student_id", UUID, nullable=False),
        sa.Column("attempt_number", sa.Integer, nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("is_late", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("answers", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("score", sa.Numeric(6, 2)),
        sa.Column("graded_by", UUID),
        sa.Column("graded_at", sa.DateTime(timezone=True)),
        sa.Column("feedback", sa.String(2000)),
        sa.ForeignKeyConstraint(
            ["assessment_id", "organization_id"], ["assessments.id", "assessments.organization_id"]
        ),
        sa.ForeignKeyConstraint(["student_id", "organization_id"], ["students.id", "students.organization_id"]),
        sa.UniqueConstraint("assessment_id", "student_id", "attempt_number", name="uq_attempts_number"),
        sa.CheckConstraint("status in ('submitted','graded')", name="ck_attempts_status"),
        sa.CheckConstraint("score is null or score >= 0", name="ck_attempts_score"),
        sa.CheckConstraint("(status = 'graded') = (score is not null)", name="ck_attempts_graded_has_score"),
    )
    op.create_index("ix_attempts_student", "assessment_attempts", ["student_id"])


def downgrade() -> None:
    op.drop_table("assessment_attempts")
    op.drop_table("assessments")
