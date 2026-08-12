import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type RecruitmentUserRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  status: string
  permissions: unknown
}

const USER_SELECT = 'id, email, first_name, last_name, role, status, permissions'

/**
 * Case-insensitive lookup by normalized (lowercase) email.
 * Handles legacy mixed-case Academy emails without creating duplicates.
 */
export async function findUserByNormalizedEmail(
  normalizedEmail: string
): Promise<{ user: RecruitmentUserRow | null; error?: string }> {
  if (!supabaseAdmin) return { user: null, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select(USER_SELECT)
    .ilike('email', normalizedEmail)
    .order('created_at', { ascending: true })
    .limit(2)

  if (error) return { user: null, error: error.message }
  if (!data?.length) return { user: null }

  // Prefer exact lowercase match when multiple legacy rows exist (should be rare).
  const exact = data.find((row) => row.email.trim().toLowerCase() === normalizedEmail)
  return { user: (exact ?? data[0]) as RecruitmentUserRow }
}

/**
 * Find or create a user for recruitment passwordless login.
 * Always stores lowercase email; retries safely on unique-constraint races.
 */
export async function findOrCreateRecruitmentUser(
  normalizedEmail: string,
  createUser: () => Promise<{ user: RecruitmentUserRow | null; error?: string }>
): Promise<{ user: RecruitmentUserRow | null; error?: string }> {
  const existing = await findUserByNormalizedEmail(normalizedEmail)
  if (existing.error) return existing
  if (existing.user) return existing

  const created = await createUser()
  if (created.user) return created

  // Unique violation or concurrent insert — fetch again
  const again = await findUserByNormalizedEmail(normalizedEmail)
  if (again.user) return again
  return { user: null, error: created.error ?? 'Could not create your account. Please try again.' }
}
