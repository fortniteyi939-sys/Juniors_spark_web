import { useState } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/app/layouts/PageHeader'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { AsyncView } from '@/components/feedback/AsyncView'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ModuleIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatDateTime } from '@/lib/format'
import { getAdminData } from '@/services/moduleService'
import type { ParameterRow, PermissionRow, RoleInfo, UserRow } from '../types'

type Tab = 'roles' | 'users' | 'params'

const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'roles', label: 'Roles y permisos' },
  { id: 'users', label: 'Usuarios' },
  { id: 'params', label: 'Parámetros y gobierno' },
]

const ROLE_COLUMNS: readonly Column<RoleInfo>[] = [
  { key: 'role', header: 'Rol', render: (r) => <b>{r.role}</b> },
  { key: 'resp', header: 'Responsabilidad', render: (r) => r.responsibility },
  { key: 'scope', header: 'Alcance de acceso', render: (r) => r.scope },
]

const MATRIX_COLUMNS: readonly Column<PermissionRow>[] = [
  { key: 'resource', header: 'Recurso', render: (r) => <b>{r.resource}</b> },
  { key: 'admin', header: 'Admin', render: (r) => r.admin },
  { key: 'teacher', header: 'Docente', render: (r) => r.teacher },
  { key: 'student', header: 'Estudiante', render: (r) => r.student },
  { key: 'analyst', header: 'Analista', render: (r) => r.analyst },
  { key: 'ml', header: 'ML Engineer', render: (r) => r.ml },
]

const USER_COLUMNS: readonly Column<UserRow>[] = [
  { key: 'user', header: 'Usuario', render: (u) => <b>{u.pseudonym}</b> },
  { key: 'role', header: 'Rol', render: (u) => u.role },
  { key: 'status', header: 'Estado', render: (u) => <StatusBadge tone={u.status === 'active' ? 'ok' : 'warn'}>{u.status === 'active' ? 'Activo' : 'Suspendido'}</StatusBadge> },
  { key: 'last', header: 'Último acceso', render: (u) => formatDateTime(u.lastAccess) },
]

const PARAM_COLUMNS: readonly Column<ParameterRow>[] = [
  { key: 'name', header: 'Parámetro', render: (p) => <b>{p.name}</b> },
  { key: 'value', header: 'Valor', render: (p) => p.value },
  { key: 'state', header: 'Estado', render: (p) => <StatusBadge tone={p.defined ? 'ok' : 'warn'}>{p.defined ? 'Definido' : 'Pendiente'}</StatusBadge> },
  { key: 'note', header: 'Nota', render: (p) => p.note },
]

export function AdministrationPage() {
  const data = useAsyncData(getAdminData, [])
  const [tab, setTab] = useState<Tab>('roles')

  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="Administración y gobierno"
        title="Administración"
        description="Usuarios, roles, permisos, parámetros y políticas. La autorización real se valida siempre en el backend."
      />
      <Tabs label="Secciones de administración" tabs={TABS} value={tab} onChange={setTab} />
      <AsyncView state={data} onRetry={data.reload}>
        {(admin) =>
          tab === 'roles' ? (
            <div className="gd">
              <section className="card c12">
                <p className="note">Ocultar un botón en React no es un control de seguridad: RBAC/ABAC se aplica en API, eventos, archivos y exportaciones.</p>
                <h2>Roles</h2>
                <DataTable caption="Roles de la plataforma" columns={ROLE_COLUMNS} rows={admin.roles} rowKey={(r) => r.role} pageSize={8} />
              </section>
              <section className="card c12">
                <h2>Matriz mínima de permisos</h2>
                <p className="sub">Por recurso y rol (spec 3).</p>
                <DataTable caption="Matriz de permisos" columns={MATRIX_COLUMNS} rows={admin.matrix} rowKey={(r) => r.resource} />
              </section>
            </div>
          ) : tab === 'users' ? (
            <section className="card">
              <h2>Usuarios</h2>
              <p className="sub">Seudónimos DEMO. Los cambios de rol y permisos quedan en auditoría.</p>
              <DataTable caption="Usuarios" columns={USER_COLUMNS} rows={admin.users} rowKey={(u) => u.id} />
            </section>
          ) : (
            <section className="card">
              <h2>Parámetros y decisiones pendientes</h2>
              <p className="sub">Lo no definido se marca como pendiente: no se inventan valores (spec 17.1).</p>
              <DataTable caption="Parámetros" columns={PARAM_COLUMNS} rows={admin.parameters} rowKey={(p) => p.name} />
            </section>
          )
        }
      </AsyncView>
    </>
  )
}
