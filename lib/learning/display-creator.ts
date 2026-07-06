export function formatCreatorLabel(
  role: string | null | undefined,
  name: string | null | undefined
): string {
  const r = String(role ?? '').toLowerCase()
  const n = (name ?? '').trim()
  if (r === 'admin' || r === 'super_admin' || r === 'staff') {
    return n ? `Admin · ${n}` : 'Admin'
  }
  if (r === 'lecturer' || r === 'instructor') {
    return n ? `Lecturer · ${n}` : 'Lecturer'
  }
  return n || 'Staff'
}

export function displayNameFromUser(row: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  firstName?: string | null
  lastName?: string | null
}): string {
  const first = row.first_name ?? row.firstName ?? ''
  const last = row.last_name ?? row.lastName ?? ''
  return [first, last].filter(Boolean).join(' ') || String(row.email ?? '').trim() || 'Staff'
}
