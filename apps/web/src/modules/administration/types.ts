export interface RoleInfo {
  role: string
  responsibility: string
  scope: string
}


export interface PermissionRow {
  resource: string
  admin: string
  teacher: string
  student: string
  analyst: string
  ml: string
}

export interface UserRow {
  id: string
  pseudonym: string
  role: string
  status: 'active' | 'suspended'
  lastAccess: string
}

export interface ParameterRow {
  name: string
  value: string
  defined: boolean
  note: string
}

export interface AdminData {
  roles: RoleInfo[]
  matrix: PermissionRow[]
  users: UserRow[]
  parameters: ParameterRow[]
}
