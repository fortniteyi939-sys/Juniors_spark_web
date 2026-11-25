export type AuditCategory = 'session' | 'permissions' | 'academic' | 'export' | 'ml' | 'config'

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  session: 'Sesión y credenciales',
  permissions: 'Roles y permisos',
  academic: 'Cursos, notas y certificados',
  export: 'Exportaciones y datos sensibles',
  ml: 'Datasets y modelos',
  config: 'Configuración y retención',
}

export interface AuditEvent {
  id: string
  at: string
  actor: string
  action: string
  resource: string
  category: AuditCategory
}
