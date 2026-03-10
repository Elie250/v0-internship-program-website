'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendApplicationEmail } from '@/lib/email'

interface BatchAcceptParams {
  ids: string[]
  sendEmail?: boolean
}

interface BatchDeclineParams {
  ids: string[]
  sendEmail?: boolean
}

export async function batchAcceptRegistrations({
  ids,
  sendEmail = true,
}: BatchAcceptParams) {
  try {
    // Get all registrations
    const { data: registrations, error: fetchError } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .in('id', ids)

    if (fetchError || !registrations) {
      console.error('[v0] Failed to fetch registrations:', fetchError)
      return { success: false, error: 'Failed to fetch registrations', processed: 0 }
    }

    // Update all to accepted
    const { error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({
        status: 'accepted',
        certificate_generated: true,
      })
      .in('id', ids)

    if (updateError) {
      console.error('[v0] Failed to update registrations:', updateError)
      return { success: false, error: 'Failed to update status', processed: 0 }
    }

    let emailsSent = 0
    let emailsFailed = 0

    // Send emails if requested
    if (sendEmail) {
      for (const registration of registrations) {
        const result = await sendApplicationEmail({
          to: registration.email,
          full_name: registration.full_name,
          program:
            registration.program || registration.training_program || 'Energy & Logics Program',
          status: 'accepted',
        })

        if (result.success) {
          emailsSent++
        } else {
          emailsFailed++
        }
      }
    }

    return {
      success: true,
      processed: registrations.length,
      emailsSent,
      emailsFailed,
      message: `Accepted ${registrations.length} applications${sendEmail ? `, ${emailsSent} emails sent` : ''}`,
    }
  } catch (error) {
    console.error('[v0] Batch accept error:', error)
    return { success: false, error: 'An error occurred', processed: 0 }
  }
}

export async function batchDeclineRegistrations({
  ids,
  sendEmail = true,
}: BatchDeclineParams) {
  try {
    // Get all registrations
    const { data: registrations, error: fetchError } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .in('id', ids)

    if (fetchError || !registrations) {
      console.error('[v0] Failed to fetch registrations:', fetchError)
      return { success: false, error: 'Failed to fetch registrations', processed: 0 }
    }

    // Update all to declined
    const { error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({ status: 'declined' })
      .in('id', ids)

    if (updateError) {
      console.error('[v0] Failed to update registrations:', updateError)
      return { success: false, error: 'Failed to update status', processed: 0 }
    }

    let emailsSent = 0
    let emailsFailed = 0

    // Send emails if requested
    if (sendEmail) {
      for (const registration of registrations) {
        const result = await sendApplicationEmail({
          to: registration.email,
          full_name: registration.full_name,
          program:
            registration.program || registration.training_program || 'Energy & Logics Program',
          status: 'declined',
        })

        if (result.success) {
          emailsSent++
        } else {
          emailsFailed++
        }
      }
    }

    return {
      success: true,
      processed: registrations.length,
      emailsSent,
      emailsFailed,
      message: `Declined ${registrations.length} applications${sendEmail ? `, ${emailsSent} emails sent` : ''}`,
    }
  } catch (error) {
    console.error('[v0] Batch decline error:', error)
    return { success: false, error: 'An error occurred', processed: 0 }
  }
}

export async function deleteRegistrations(ids: string[]) {
  try {
    const { error } = await supabaseAdmin.from('registrations').delete().in('id', ids)

    if (error) {
      console.error('[v0] Failed to delete registrations:', error)
      return { success: false, error: 'Failed to delete' }
    }

    return { success: true, message: `Deleted ${ids.length} applications` }
  } catch (error) {
    console.error('[v0] Delete error:', error)
    return { success: false, error: 'An error occurred' }
  }
}
