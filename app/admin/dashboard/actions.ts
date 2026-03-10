'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendApplicationEmail } from '@/lib/email'
import { generateCertificateId } from '@/lib/certificate-generator'

export async function acceptRegistration(id: string) {
  try {
    // Get registration details first
    const { data: registration, error: fetchError } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !registration) {
      console.error('[v0] Failed to fetch registration:', fetchError)
      return { success: false, error: 'Registration not found' }
    }

    // Update status to accepted
    const { error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({
        status: 'accepted',
        certificate_generated: true,
      })
      .eq('id', id)

    if (updateError) {
      console.error('[v0] Failed to update registration:', updateError)
      return { success: false, error: 'Failed to update status' }
    }

    // Send acceptance email
    const emailResult = await sendApplicationEmail({
      to: registration.email,
      full_name: registration.full_name,
      program: registration.program || registration.training_program || 'Energy & Logics Program',
      status: 'accepted',
    })

    if (!emailResult.success) {
      console.error('[v0] Failed to send acceptance email')
      return { success: false, error: 'Status updated but email failed' }
    }

    return { success: true, message: 'Application accepted and email sent' }
  } catch (error) {
    console.error('[v0] Accept registration error:', error)
    return { success: false, error: 'An error occurred' }
  }
}

export async function declineRegistration(id: string) {
  try {
    // Get registration details first
    const { data: registration, error: fetchError } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !registration) {
      console.error('[v0] Failed to fetch registration:', fetchError)
      return { success: false, error: 'Registration not found' }
    }

    // Update status to declined
    const { error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({ status: 'declined' })
      .eq('id', id)

    if (updateError) {
      console.error('[v0] Failed to update registration:', updateError)
      return { success: false, error: 'Failed to update status' }
    }

    // Send decline email
    const emailResult = await sendApplicationEmail({
      to: registration.email,
      full_name: registration.full_name,
      program: registration.program || registration.training_program || 'Energy & Logics Program',
      status: 'declined',
    })

    if (!emailResult.success) {
      console.error('[v0] Failed to send decline email')
      return { success: false, error: 'Status updated but email failed' }
    }

    return { success: true, message: 'Application declined and email sent' }
  } catch (error) {
    console.error('[v0] Decline registration error:', error)
    return { success: false, error: 'An error occurred' }
  }
}
