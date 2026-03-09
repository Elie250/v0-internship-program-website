import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Registration = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  school: string;
  program: string;
  level: string;
  duration: string;
  message: string;
  created_at: string;
};
