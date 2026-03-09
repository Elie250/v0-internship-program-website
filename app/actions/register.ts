'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function submitRegistration(formData: {
  fullName: string;
  email: string;
  phone: string;
  school: string;
  program: string;
  level: string;
  duration: string;
  message: string;
}) {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .insert([
        {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          school: formData.school,
          program: formData.program,
          level: formData.level,
          duration: formData.duration,
          message: formData.message,
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}
