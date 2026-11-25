"""auditoría de solo anexado

Revision ID: 0003
Revises: 0002
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.modules.audit.immutability import FUNCTION_SQL, TRIGGER_SQL

revision = "0003"
down_revision = "0002"


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("resource", sa.String(48), nullable=False),
        sa.Column("resource_id", postgresql.UUID(as_uuid=True)),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("correlation_id", sa.String(64), nullable=False),
        sa.Column("details", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    op.create_index("ix_audit_org_occurred", "audit_logs", ["organization_id", "occurred_at"])
    op.execute(FUNCTION_SQL)
    op.execute(TRIGGER_SQL)


def downgrade() -> None:
    op.drop_table("audit_logs")  # el trigger se elimina con la tabla
    op.execute("DROP FUNCTION IF EXISTS audit_logs_immutable()")
