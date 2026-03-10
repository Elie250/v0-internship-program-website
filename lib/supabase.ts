//import { createClient } from '@supabase/supabase-js';
//import { supabase } from '@/lib/supabase'
//const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
//const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

//export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
