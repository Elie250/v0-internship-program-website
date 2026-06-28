export type AuthDebugInfo = {
  step: string
  supabaseUrlSet: boolean
  serviceRoleKeySet: boolean
  supabaseUrlValid?: boolean
  supabaseUrlIssue?: string
  supabaseHostname?: string
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

import {
  resolveSupabaseUrl,
  resolveSupabaseServiceRoleKey,
  resolveSupabaseAnonKey,
  validateSupabaseUrl,
} from '@/lib/supabase/config'

export function getSupabaseConfigStatus() {
  const url = resolveSupabaseUrl()
  const urlValidation = validateSupabaseUrl(url)

  return {
    supabaseUrlSet: Boolean(url),
    serviceRoleKeySet: Boolean(resolveSupabaseServiceRoleKey()),
    anonKeySet: Boolean(resolveSupabaseAnonKey()),
    authDebugEnabled: isAuthDebugEnabled(),
    supabaseUrlValid: urlValidation.valid,
    supabaseUrlIssue: urlValidation.issue,
    supabaseHostname: urlValidation.hostname,
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
