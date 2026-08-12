import { cookies } from 'next/headers'
import {
  getRecruitmentSessionUser,
  isRecruitmentPlatformAdmin,
  listUserMemberships,
  requireOrganizationAccess,
} from '@/lib/recruitment/authz'
import { listOrganizations } from '@/lib/recruitment/organizations'
import type { RecruitmentOrgRole } from '@/lib/recruitment/types'

export const EMPLOYER_ORG_COOKIE = 'recruitment_employer_org'

export type EmployerOrgOption = {
  id: string
  name: string
  slug: string
  status: string
  role: RecruitmentOrgRole | 'platform_admin'
}

export async function listEmployerOrganizations(): Promise<{
  userId: string
  asPlatformAdmin: boolean
  organizations: EmployerOrgOption[]
}> {
  const user = await getRecruitmentSessionUser()
  if (!user) throw new Error('Unauthorized')

  if (isRecruitmentPlatformAdmin(user)) {
    const { organizations } = await listOrganizations({ status: 'all' })
    return {
      userId: user.id,
      asPlatformAdmin: true,
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        role: 'platform_admin' as const,
      })),
    }
  }

  const memberships = await listUserMemberships(user.id)
  const organizations: EmployerOrgOption[] = []
  for (const row of memberships) {
    const org = Array.isArray(row.organization) ? row.organization[0] : row.organization
    if (!org?.id) continue
    organizations.push({
      id: String(org.id),
      name: String(org.name ?? 'Organization'),
      slug: String(org.slug ?? ''),
      status: String(org.status ?? 'draft'),
      role: row.role as RecruitmentOrgRole,
    })
  }

  return { userId: user.id, asPlatformAdmin: false, organizations }
}

export async function getActiveEmployerOrganizationId(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(EMPLOYER_ORG_COOKIE)?.value?.trim()
  return raw || null
}

export async function resolveEmployerOrganization(requestedOrgId?: string | null): Promise<{
  userId: string
  asPlatformAdmin: boolean
  organization: EmployerOrgOption
  organizations: EmployerOrgOption[]
}> {
  const { userId, asPlatformAdmin, organizations } = await listEmployerOrganizations()
  if (organizations.length === 0) throw new Error('Forbidden')

  const cookieOrgId = await getActiveEmployerOrganizationId()
  const preferred = requestedOrgId || cookieOrgId
  const selected =
    organizations.find((org) => org.id === preferred) ?? organizations[0]

  if (!selected) throw new Error('Forbidden')
  if (selected.id !== cookieOrgId) {
    await setActiveEmployerOrganizationCookie(selected.id)
  }
  return { userId, asPlatformAdmin, organization: selected, organizations }
}

export async function setActiveEmployerOrganizationCookie(organizationId: string) {
  const cookieStore = await cookies()
  cookieStore.set(EMPLOYER_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function requireEmployerOrgAccess(
  organizationId: string,
  allowedRoles?: RecruitmentOrgRole[]
) {
  return requireOrganizationAccess(organizationId, allowedRoles)
}
