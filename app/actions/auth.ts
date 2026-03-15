'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, user: data.user }
}

export async function logout() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false }
  }

  return { success: true }
}