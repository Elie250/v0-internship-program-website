import {
  MENTOR_PROGRAM_TYPES,
  normalizeProgramType,
  type ProgramType,
} from '@/lib/enrollment/program-types'

export const LECTURER_DELIVERY_ROLES = ['lecturer', 'instructor'] as const
export const MENTOR_DELIVERY_ROLE = 'mentor' as const

export type DeliveryPortalRole = (typeof LECTURER_DELIVERY_ROLES)[number] | typeof MENTOR_DELIVERY_ROLE

export function isLecturerDeliveryRole(role: string | undefined): boolean {
  return role === 'lecturer' || role === 'instructor'
}

export function isMentorDeliveryRole(role: string | undefined): boolean {
  return role === 'mentor'
}

export function isDeliveryPortalRole(role: string | undefined): boolean {
  return isLecturerDeliveryRole(role) || isMentorDeliveryRole(role)
}

export function deliveryLoginRoleForUser(role: string): 'lecturer' | 'mentor' {
  return isMentorDeliveryRole(role) ? 'mentor' : 'lecturer'
}

export function programTypesForDeliveryRole(role: string): ProgramType[] | null {
  if (isMentorDeliveryRole(role)) return MENTOR_PROGRAM_TYPES
  return null
}

export function canDeliverProgramType(role: string, programType: unknown): boolean {
  const allowed = programTypesForDeliveryRole(role)
  if (!allowed) return true
  return allowed.includes(normalizeProgramType(programType))
}

export function usesMentorAssignment(programType: unknown): boolean {
  return canDeliverProgramType('mentor', programType)
}

export function portalBranding(role: string) {
  if (isMentorDeliveryRole(role)) {
    return {
      title: 'Career portal',
      subtitle: 'Career guidance & mentorship programmes',
      programmesLabel: 'My career programmes',
      proposeLabel: 'Propose career programme',
    }
  }
  return {
    title: 'Lecturer portal',
    subtitle: 'Assigned programmes & classroom',
    programmesLabel: 'My programmes',
    proposeLabel: 'Propose new programme',
  }
}

export type DeliveryNavItem = {
  id: string
  href: string
  label: string
  match: 'programmes' | 'students' | 'library' | 'tools' | 'profile'
}

const FULL_NAV: DeliveryNavItem[] = [
  { id: 'programmes', href: '/lecturer/dashboard', label: 'My programmes', match: 'programmes' },
  { id: 'students', href: '/lecturer/students', label: 'Students', match: 'students' },
  { id: 'library', href: '/lecturer/library', label: 'Library', match: 'library' },
  { id: 'tools', href: '/lecturer/tools', label: 'Tools', match: 'tools' },
  { id: 'profile', href: '/lecturer/profile', label: 'Profile', match: 'profile' },
]

export function deliveryNavForRole(role: string): DeliveryNavItem[] {
  if (isMentorDeliveryRole(role)) {
    return FULL_NAV.filter((item) => item.id !== 'library' && item.id !== 'tools').map((item) =>
      item.id === 'programmes' ? { ...item, label: 'My career programmes' } : item
    )
  }
  return FULL_NAV
}
