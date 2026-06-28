import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  resolveSupabaseServiceRoleKey,
  resolveSupabaseUrl,
  validateSupabaseUrl,
} from '@/lib/supabase/config'

const supabaseUrl = resolveSupabaseUrl()
const supabaseServiceRoleKey = resolveSupabaseServiceRoleKey()
const urlValidation = validateSupabaseUrl(supabaseUrl)

export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey && urlValidation.valid
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        db: { schema: 'public' },
      })
    : null

export const supabaseAdminConfig = {
  urlSet: Boolean(supabaseUrl),
  serviceRoleKeySet: Boolean(supabaseServiceRoleKey),
  urlValidation,
}
