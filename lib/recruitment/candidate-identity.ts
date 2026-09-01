/**
 * Resolve a display name and email for employer screens.
 * Prefer the application snapshot, then the user account. Never invent a name.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type CandidateIdentity = {
  name: string
  email: string
}

export type UserIdentityRow = {
  email: string
  first_name: string
  last_name: string
}

function asText(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function displayCandidateName(input: {
  snapshotName?: unknown
  firstName?: unknown
  lastName?: unknown
}): string {
  const fromSnapshot = asText(input.snapshotName)
  if (fromSnapshot) return fromSnapshot
  const fromAccount = [input.firstName, input.lastName].map(asText).filter(Boolean).join(' ')
  return fromAccount || 'Candidate'
}

export function identityFromSnapshotAndUser(
  snapshot: Record<string, unknown> | null | undefined,
  user?: UserIdentityRow | null
): CandidateIdentity {
  const snap = snapshot && typeof snapshot === 'object' ? snapshot : {}
  return {
    name: displayCandidateName({
      snapshotName: snap.full_name,
      firstName: user?.first_name,
      lastName: user?.last_name,
    }),
    email: asText(snap.email) || asText(user?.email),
  }
}

export async function loadUsersByIds(ids: string[]): Promise<Map<string, UserIdentityRow>> {
  const unique = Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)))
  const map = new Map<string, UserIdentityRow>()
  if (!supabaseAdmin || unique.length === 0) return map

  const { data } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name')
    .in('id', unique)

  for (const row of data ?? []) {
    map.set(String(row.id), {
      email: asText(row.email),
      first_name: asText(row.first_name),
      last_name: asText(row.last_name),
    })
  }
  return map
}

export function fillSnapshotIdentity(
  snapshot: Record<string, unknown> | null | undefined,
  user?: UserIdentityRow | null
): Record<string, unknown> {
  const snap = { ...(snapshot && typeof snapshot === 'object' ? snapshot : {}) }
  const identity = identityFromSnapshotAndUser(snap, user)
  if (!asText(snap.full_name) && identity.name !== 'Candidate') {
    snap.full_name = identity.name
  }
  if (!asText(snap.email) && identity.email) {
    snap.email = identity.email
  }
  return snap
}
