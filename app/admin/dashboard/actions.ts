'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendApplicationEmail } from '@/lib/email'

export async function acceptApplication(id: string) {
  const { data: application, error: fetchError } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !application) return { success: false }

  const { error: updateError } = await supabaseAdmin
    .from('registrations')
    .update({ status: 'accepted', certificate_generated: true })
    .eq('id', id)

  if (updateError) return { success: false }

  await sendApplicationEmail({
    to: application.email,
    full_name: application.full_name,
    program: application.program,
    status: 'accepted'
  })

  return { success: true }
}

export async function declineApplication(id: string) {
  const { data: application, error: fetchError } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !application) return { success: false }

  const { error: updateError } = await supabaseAdmin
    .from('registrations')
    .update({ status: 'declined' })
    .eq('id', id)

  if (updateError) return { success: false }

  await sendApplicationEmail({
    to: application.email,
    full_name: application.full_name,
    program: application.program,
    status: 'declined'
  })

  return { success: true }
}