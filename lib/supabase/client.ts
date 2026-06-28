import { createBrowserClient } from '@supabase/ssr'
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from '@/lib/supabase/config'

export function createClient() {
  return createBrowserClient(
    resolveSupabaseUrl(),
    resolveSupabaseAnonKey(),
  )
}
