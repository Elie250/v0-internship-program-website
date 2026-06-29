export const USER_ROLES = [
  'student',
  'registered',
  'lecturer',
  'engineer',
  'mentor',
  'instructor',
  'support_staff',
  'admin',
] as const

export type AdminUserRole = (typeof USER_ROLES)[number]

export type AdminUserRecord = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  status: string
  permissions: string[]
  created_at: string
}
