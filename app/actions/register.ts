'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function submitRegistration(data: any) {

  const { error } = await supabase
    .from('registrations')
    .insert([
      {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,

        school: data.school || null,
        program: data.program || data.trainingProgram || null,
        level: data.level || null,
        duration: data.duration || null,

        profession: data.profession || null,
        schedule: data.schedule || null,

        message: data.message || null,

        registration_type: data.registrationType || 'Student'
      }
    ])

  if (error) {
    console.error(error)
    throw new Error('Registration failed')
  }

  return { success: true }
}