export const STAFF_SELF_REGISTER_ROLES = ['lecturer', 'engineer'] as const

export type StaffSelfRegisterRole = (typeof STAFF_SELF_REGISTER_ROLES)[number]

export function requiresAdminApproval(role: string): boolean {
  return STAFF_SELF_REGISTER_ROLES.includes(role as StaffSelfRegisterRole)
}

export function isLoginAllowedStatus(status: string | null | undefined): boolean {
  return status === 'active'
}

export function loginBlockedMessage(status: string, role: string): string {
  if (status === 'pending_approval') {
    if (role === 'lecturer' || role === 'instructor') {
      return 'Your lecturer account is awaiting admin approval. An administrator must activate your account and set permissions before you can sign in.'
    }
    if (role === 'engineer') {
      return 'Your engineer account is awaiting admin approval. An administrator must activate your account before you can sign in.'
    }
    return 'Your account is awaiting admin approval. Please contact the administrator.'
  }
  if (status === 'inactive') {
    return 'This account is inactive. Contact the administrator to restore access.'
  }
  if (status === 'suspended') {
    return 'This account has been suspended. Contact the administrator for assistance.'
  }
  return `Account status is "${status}" (must be active).`
}
