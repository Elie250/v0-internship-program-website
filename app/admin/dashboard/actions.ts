'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function acceptRegistration(id: string) {

  await supabaseAdmin
    .from('registrations')
    .update({ status: 'accepted' })
    .eq('id', id)

}

export async function deleteRegistration(id: string) {

  await supabaseAdmin
    .from('registrations')
    .delete()
    .eq('id', id)

}