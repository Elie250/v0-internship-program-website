'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function acceptRegistration(id: string) {

  const { error } = await supabaseAdmin
    .from('registrations')
    .update({ status: 'accepted' })
    .eq('id', id)

  if (error) {
    console.error(error)
  }
}

export async function declineRegistration(id: string) {

  const { error } = await supabaseAdmin
    .from('registrations')
    .update({ status: 'declined' })
    .eq('id', id)

  if (error) {
    console.error(error)
  }
}