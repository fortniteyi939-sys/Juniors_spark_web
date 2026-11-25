"""identidad: organizaciones, usuarios y roles

Revision ID: 0001
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None

UUID = postgresql.UUID(as_uuid=True)
ROLES = [
    ("superadmin", "Gobierno global de la plataforma"),
    ("institution_admin", "Operación de una institución"),
    ("coordinator", "Seguimiento académico"),
    ("instructor", "Gestión de enseñanza"),
    ("student", "Aprendizaje personal"),
    ("data_analyst", "Analítica y dataset"),
    ("ml_engineer", "Ciclo de vida del modelo"),
    ("auditor", "Control y cumplimiento (solo lectura)"),
]


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", UUID, primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("code", sa.String(32), nullable=False, unique=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="active"),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="America/Lima"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("status in ('active','suspended')", name="ck_organizations_status"),
    )
    roles = op.create_table(
        "roles",
        sa.Column("id", UUID, primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("code", sa.String(32), nullable=False, unique=True),
        sa.Column("description", sa.String(200), nullable=False),
    )
    op.create_table(
        "users",
        sa.Column("id", UUID, primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID, sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("email_normalized", sa.String(320), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="invited"),
        sa.Column("idp_subject", sa.String(255), unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("status in ('active','disabled','invited')", name="ck_users_status"),
        sa.UniqueConstraint("organization_id", "email_normalized", name="uq_users_org_email"),
    )
    op.create_index("ix_users_organization_id", "users", ["organization_id"])
    op.create_table(
        "user_roles",
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role_id", UUID, sa.ForeignKey("roles.id"), primary_key=True),
    )
    op.bulk_insert(roles, [{"code": c, "description": d} for c, d in ROLES])


def downgrade() -> None:
    op.drop_table("user_roles")
    op.drop_index("ix_users_organization_id", table_name="users")
    op.drop_table("users")
    op.drop_table("roles")
    op.drop_table("organizations")
