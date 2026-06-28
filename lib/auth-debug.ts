export type AuthDebugInfo = {
  step: string
  supabaseUrlSet: boolean
  serviceRoleKeySet: boolean
  email: string
  role: string
  userFound: boolean
  userRole?: string
  userStatus?: string
  passwordFieldPresent?: boolean
  passwordHashType?: 'bcrypt' | 'plain' | 'missing'
  passwordMatch?: boolean
  usersWithEmailCount?: number
  rolesForEmail?: string[]
  dbError?: string
  dbCode?: string
  exception?: string
}

export function isAuthDebugEnabled() {
  return (
    process.env.AUTH_DEBUG === 'true' ||
    process.env.NODE_ENV === 'development'
  )
}

export function getSupabaseConfigStatus() {
  return {
    supabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceRoleKeySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    anonKeySet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    authDebugEnabled: isAuthDebugEnabled(),
  }
}

export function classifyPasswordHash(stored: string | null | undefined): AuthDebugInfo['passwordHashType'] {
  if (!stored) return 'missing'
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return 'bcrypt'
  }
  return 'plain'
}

export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}
