'use server'

import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseServiceRoleKey, resolveSupabaseUrl } from '@/lib/supabase/config'

const supabase = createClient(
  resolveSupabaseUrl(),
  resolveSupabaseServiceRoleKey(),
)

export async function submitRegistration(data: any) {

  const { error } = await supabase
    .from('registrations')
    .insert([
      {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        school: data.school,
        program: data.program,
        level: data.level,
        duration: data.duration,
        profession: data.profession,
        training_program: data.trainingProgram,
        schedule: data.schedule,
        message: data.message,
        registration_type: data.registrationType
      }
    ])

  if (error) {
    console.error(error)
    throw new Error('Registration failed')
  }
}