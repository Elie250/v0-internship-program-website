export type AdminApplicationRow = {
  id: string
  full_name: string
  email: string
  phone?: string | null
  program?: string | null
  duration?: string | null
  registration_type?: string | null
  status: string
  created_at: string
  source: 'applications' | 'registrations'
}

function normalizeStatus(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.toLowerCase()
  return 'pending'
}

function mapApplicationRow(row: Record<string, unknown>): AdminApplicationRow {
  return {
    id: String(row.id),
    full_name: String(row.full_name ?? row.name ?? 'Unknown'),
    email: String(row.email ?? ''),
    phone: (row.phone as string | null) ?? null,
    program: (row.program as string | null) ?? null,
    duration: String(row.duration ?? row.preferred_duration ?? '-'),
    registration_type: (row.registration_type as string | null) ?? 'Program application',
    status: normalizeStatus(row.status),
    created_at: String(row.created_at ?? new Date().toISOString()),
    source: 'applications',
  }
}

function mapRegistrationRow(row: Record<string, unknown>): AdminApplicationRow {
  return {
    id: String(row.id),
    full_name: String(row.full_name ?? row.name ?? 'Unknown'),
    email: String(row.email ?? ''),
    phone: (row.phone as string | null) ?? null,
    program: (row.program ?? row.training_program) as string | null,
    duration: String(row.duration ?? row.preferred_duration ?? row.schedule ?? '-'),
    registration_type: (row.registration_type as string | null) ?? 'Registration',
    status: normalizeStatus(row.registration_status ?? row.status),
    created_at: String(row.created_at ?? new Date().toISOString()),
    source: 'registrations',
  }
}

export function mapApplicationRecord(
  row: Record<string, unknown>,
  source: 'applications' | 'registrations'
): AdminApplicationRow {
  return source === 'applications' ? mapApplicationRow(row) : mapRegistrationRow(row)
}

export async function queryAdminApplications(): Promise<{
  applications: AdminApplicationRow[]
  registrations: AdminApplicationRow[]
  error?: string
}> {
  const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
  if (!supabaseAdmin) {
    return { applications: [], registrations: [], error: 'Database not configured' }
  }

  const [applicationsRes, registrationsRes] = await Promise.all([
    supabaseAdmin.from('applications').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('registrations').select('*').order('created_at', { ascending: false }),
  ])

  if (applicationsRes.error) {
    return { applications: [], registrations: [], error: applicationsRes.error.message }
  }
  if (registrationsRes.error) {
    return { applications: [], registrations: [], error: registrationsRes.error.message }
  }

  return {
    applications: (applicationsRes.data ?? []).map((row) =>
      mapApplicationRow(row as Record<string, unknown>)
    ),
    registrations: (registrationsRes.data ?? []).map((row) =>
      mapRegistrationRow(row as Record<string, unknown>)
    ),
  }
}
