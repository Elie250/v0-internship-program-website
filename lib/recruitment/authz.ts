import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/admin/permissions'
import type { RecruitmentOrgRole } from '@/lib/recruitment/types'

export type RecruitmentSessionUser = {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  permissions: string[]
}

export async function getRecruitmentSessionUser(): Promise<RecruitmentSessionUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('user_session')?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as {
      id?: string
      email?: string
      role?: string
      firstName?: string
      lastName?: string
      permissions?: string[]
    }
    if (!parsed.id || !parsed.email) return null
    return {
      id: parsed.id,
      email: parsed.email,
      role: String(parsed.role ?? 'registered'),
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
    }
  } catch {
    return null
  }
}

/** Platform (Energy & Logics) admin — not an organization membership. */
export function isRecruitmentPlatformAdmin(user: RecruitmentSessionUser | null): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  return hasPermission(user.permissions, PERMISSIONS.RECRUITMENT_ORGS_MANAGE)
}

export async function requireRecruitmentPlatformAdmin(
  permission: Permission = PERMISSIONS.RECRUITMENT_ORGS_MANAGE
): Promise<RecruitmentSessionUser> {
  const user = await getRecruitmentSessionUser()
  if (!user) throw new Error('Unauthorized')
  if (user.role === 'admin') return user
  if (!hasPermission(user.permissions, permission)) throw new Error('Forbidden')
  return user
}

export async function getActiveMembership(
  userId: string,
  organizationId: string
): Promise<{ id: string; role: RecruitmentOrgRole; organization_id: string } | null> {
  if (!supabaseAdmin) return null
  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_memberships')
    .select(
      'id, role, organization_id, status, organization:recruitment_organizations(id, status)'
    )
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .maybeSingle()

  if (error || !data) return null
  const org = Array.isArray(data.organization) ? data.organization[0] : data.organization
  // Suspended / draft orgs never grant employer workspace access (platform admin bypasses separately).
  if (!org || String(org.status) !== 'active') return null
  return {
    id: String(data.id),
    role: data.role as RecruitmentOrgRole,
    organization_id: String(data.organization_id),
  }
}

/**
 * Resolve org authorization from membership (never trust browser org_id alone).
 * Platform admins may access any org for foundation management.
 */
export async function requireOrganizationAccess(
  organizationId: string,
  allowedRoles?: RecruitmentOrgRole[]
): Promise<{
  user: RecruitmentSessionUser
  membership: { id: string; role: RecruitmentOrgRole; organization_id: string } | null
  asPlatformAdmin: boolean
}> {
  const user = await getRecruitmentSessionUser()
  if (!user) throw new Error('Unauthorized')

  if (isRecruitmentPlatformAdmin(user)) {
    return { user, membership: null, asPlatformAdmin: true }
  }

  const membership = await getActiveMembership(user.id, organizationId)
  if (!membership) throw new Error('Forbidden')

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new Error('Forbidden')
  }

  return { user, membership, asPlatformAdmin: false }
}

export async function listUserMemberships(userId: string) {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('recruitment_organization_memberships')
    .select(
      'id, role, status, organization_id, created_at, organization:recruitment_organizations(id, name, slug, status)'
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []).filter((row) => {
    const org = Array.isArray(row.organization) ? row.organization[0] : row.organization
    return org && String(org.status) === 'active'
  })
}
