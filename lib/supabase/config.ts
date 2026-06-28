/** Normalize and validate Supabase project URL for REST API clients. */
export function normalizeSupabaseUrl(raw: string): string {
  let url = raw.trim()
  if (!url) return ''

  url = url.replace(/\/+$/, '')
  url = url.replace(/\/rest\/v1\/?$/i, '')

  return url
}

export function resolveSupabaseUrl(): string {
  return normalizeSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      ''
  )
}

export function resolveSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim()
}

export function resolveSupabaseServiceRoleKey(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
}

export function validateSupabaseUrl(url: string): {
  valid: boolean
  hostname?: string
  issue?: string
} {
  if (!url) {
    return { valid: false, issue: 'URL is empty' }
  }

  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname

    if (!/^https?:$/.test(parsed.protocol)) {
      return { valid: false, issue: 'URL must start with https://' }
    }

    if (parsed.pathname && parsed.pathname !== '/') {
      return {
        valid: false,
        hostname,
        issue: `URL must not include a path (found "${parsed.pathname}"). Use only https://YOUR_PROJECT.supabase.co`,
      }
    }

    if (!hostname.endsWith('.supabase.co')) {
      return {
        valid: false,
        hostname,
        issue: 'URL should look like https://YOUR_PROJECT_REF.supabase.co (Supabase → Settings → API → Project URL)',
      }
    }

    return { valid: true, hostname }
  } catch {
    return { valid: false, issue: 'URL is not a valid URL string' }
  }
}
