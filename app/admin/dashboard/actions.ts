'use server'

import { supabaseAdmin } from '../../../lib/supabaseAdmin' // fixed relative path

export async function acceptApplication(id: string) {
  // fetch the application
  const { data: application, error: fetchError } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !application) return { success: false }

  // update status to accepted
  const { error: updateError } = await supabaseAdmin
    .from('registrations')
    .update({ status: 'accepted', certificate_generated: true })
    .eq('id', id)

  if (updateError) return { success: false }

  return { success: true }
}

export async function declineApplication(id: string) {
  // fetch the application
  const { data: application, error: fetchError } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !application) return { success: false }

  // update status to declined
  const { error: updateError } = await supabaseAdmin
    .from('registrations')
    .update({ status: 'declined' })
    .eq('id', id)

  if (updateError) return { success: false }

  return { success: true }
}