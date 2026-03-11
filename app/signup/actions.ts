'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { redirect } from 'next/navigation'

export async function createStudent(formData: FormData) {

  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabaseAdmin
    .from("students")
    .insert([
      {
        username,
        email,
        password
      }
    ])

  if (error) {
    redirect("/signup?error=userexists")
  }

  redirect("/login?created=true")
}