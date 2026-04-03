import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client for browser/client-side operations
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (with full permissions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type SupabaseClient = typeof supabaseClient;
export type SupabaseAdmin = typeof supabaseAdmin;
