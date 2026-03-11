'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendApplicationEmail } from '@/lib/email'

export async function acceptApplication(id: string) {
  try {
    // Get application details first
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !application) {
      console.error('[Admin] Failed to fetch application:', fetchError)
      return { success: false, error: 'Application not found' }
    }

    // Update status to accepted
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'accepted',
        certificate_generated: true
      })
      .eq('id', id)

    if (updateError) {
      console.error('[Admin] Failed to update application:', updateError)
      return { success: false, error: 'Failed to update status' }
    }

    // Send acceptance email
    const emailResult = await sendApplicationEmail({
      to: application.email,
      full_name: application.full_name || 'Student',
      program: application.program || 'Energy & Logics Program',
      status: 'accepted'
    })

    if (!emailResult.success) {
      console.error('[Admin] Failed to send acceptance email')
      return { success: false, error: 'Status updated but email failed' }
    }

    return { success: true, message: 'Application accepted and email sent' }
  } catch (error) {
    console.error('[Admin] Accept application error:', error)
    return { success: false, error: 'An error occurred' }
  }
}

export async function declineApplication(id: string) {
  try {
    // Get application details first
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !application) {
      console.error('[Admin] Failed to fetch application:', fetchError)
      return { success: false, error: 'Application not found' }
    }

    // Update status to declined
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({ status: 'declined' })
      .eq('id', id)

    if (updateError) {
      console.error('[Admin] Failed to update application:', updateError)
      return { success: false, error: 'Failed to update status' }
    }

    // Send decline email
    const emailResult = await sendApplicationEmail({
      to: application.email,
      full_name: application.full_name || 'Student',
      program: application.program || 'Energy & Logics Program',
      status: 'declined'
    })

    if (!emailResult.success) {
      console.error('[Admin] Failed to send decline email')
      return { success: false, error: 'Status updated but email failed' }
    }

    return { success: true, message: 'Application declined and email sent' }
  } catch (error) {
    console.error('[Admin] Decline application error:', error)
    return { success: false, error: 'An error occurred' }
  }
}