'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { redirect } from 'next/navigation'

export async function loginStudent(formData: FormData) {

  const username = formData.get("username") as string
  const password = formData.get("password") as string

  const { data } = await supabaseAdmin
    .from("students")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single()

  if (!data) {
    redirect("/student/login?error=invalid")
  }

  redirect("/student/dashboard")
}