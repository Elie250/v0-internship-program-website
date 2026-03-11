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

export async function batchAcceptApplications({
  ids,
  sendEmail = true,
}: BatchAcceptParams) {
  try {
    // Get all applications
    const { data: applications, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .in('id', ids)

    if (fetchError || !applications) {
      console.error('[Admin] Failed to fetch applications:', fetchError)
      return { success: false, error: 'Failed to fetch applications', processed: 0 }
    }

    // Update all to accepted
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'accepted',
        certificate_generated: true,
      })
      .in('id', ids)

    if (updateError) {
      console.error('[Admin] Failed to update applications:', updateError)
      return { success: false, error: 'Failed to update status', processed: 0 }
    }

    let emailsSent = 0
    let emailsFailed = 0

    // Send emails if requested
    if (sendEmail) {
      for (const application of applications) {
        const result = await sendApplicationEmail({
          to: application.email,
          full_name: application.full_name || 'Student',
          program: application.program || 'Energy & Logics Program',
          status: 'accepted',
        })

        if (result.success) emailsSent++
        else emailsFailed++
      }
    }

    return {
      success: true,
      processed: applications.length,
      emailsSent,
      emailsFailed,
      message: `Accepted ${applications.length} applications${sendEmail ? `, ${emailsSent} emails sent` : ''}`,
    }
  } catch (error) {
    console.error('[Admin] Batch accept error:', error)
    return { success: false, error: 'An error occurred', processed: 0 }
  }
}

export async function batchDeclineApplications({
  ids,
  sendEmail = true,
}: BatchDeclineParams) {
  try {
    // Get all applications
    const { data: applications, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .in('id', ids)

    if (fetchError || !applications) {
      console.error('[Admin] Failed to fetch applications:', fetchError)
      return { success: false, error: 'Failed to fetch applications', processed: 0 }
    }

    // Update all to declined
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({ status: 'declined' })
      .in('id', ids)

    if (updateError) {
      console.error('[Admin] Failed to update applications:', updateError)
      return { success: false, error: 'Failed to update status', processed: 0 }
    }

    let emailsSent = 0
    let emailsFailed = 0

    // Send emails if requested
    if (sendEmail) {
      for (const application of applications) {
        const result = await sendApplicationEmail({
          to: application.email,
          full_name: application.full_name || 'Student',
          program: application.program || 'Energy & Logics Program',
          status: 'declined',
        })

        if (result.success) emailsSent++
        else emailsFailed++
      }
    }

    return {
      success: true,
      processed: applications.length,
      emailsSent,
      emailsFailed,
      message: `Declined ${applications.length} applications${sendEmail ? `, ${emailsSent} emails sent` : ''}`,
    }
  } catch (error) {
    console.error('[Admin] Batch decline error:', error)
    return { success: false, error: 'An error occurred', processed: 0 }
  }
}

export async function deleteApplications(ids: string[]) {
  try {
    const { error } = await supabaseAdmin.from('applications').delete().in('id', ids)

    if (error) {
      console.error('[Admin] Failed to delete applications:', error)
      return { success: false, error: 'Failed to delete' }
    }

    return { success: true, message: `Deleted ${ids.length} applications` }
  } catch (error) {
    console.error('[Admin] Delete error:', error)
    return { success: false, error: 'An error occurred' }
  }
}