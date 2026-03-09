'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function submitIndividualRegistration(data: any) {

  const { error } = await supabase
    .from('individual_registrations')
    .insert([
      {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        profession: data.profession,
        training_program: data.trainingProgram,
        schedule: data.schedule,
        message: data.message,
      }
    ])

  if (error) throw error

  return { success: true }
}