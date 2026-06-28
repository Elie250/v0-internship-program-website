import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from '@/lib/supabase/config'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = resolveSupabaseUrl()
  const supabaseAnonKey = resolveSupabaseAnonKey()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Called from a Server Component — safe to ignore
        }
      },
    },
  })
}
