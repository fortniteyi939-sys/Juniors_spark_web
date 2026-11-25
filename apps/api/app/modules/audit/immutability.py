"""Auditoría de solo anexado (spec 11): la BD rechaza UPDATE y DELETE sobre audit_logs.
No cubre TRUNCATE ni a un superusuario de BD: complementar con permisos de rol y backups (pendiente)."""

FUNCTION_SQL = """
CREATE OR REPLACE FUNCTION audit_logs_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs es de solo anexado';
END;
$$ LANGUAGE plpgsql
"""

TRIGGER_SQL = """
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable()
"""
