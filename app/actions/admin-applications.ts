'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { sendApplicationEmail } from '@/lib/email'
import {
  queryAdminApplications,
  mapApplicationRecord,
  type AdminApplicationRow,
} from '@/lib/admin/data/applications'

export type { AdminApplicationRow }

export async function listAdminApplications(): Promise<{
  success: boolean
  applications?: AdminApplicationRow[]
  registrations?: AdminApplicationRow[]
  error?: string
}> {
  try {
    await requireAdminPermission(PERMISSIONS.APPLICATIONS_VIEW)
    const { applications, registrations, error } = await queryAdminApplications()
    if (error) return { success: false, error }
    return { success: true, applications, registrations }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load applications',
    }
  }
}

async function updateRowStatus(
  source: 'applications' | 'registrations',
  id: string,
  status: string
) {
  if (!supabaseAdmin) return { success: false as const, error: 'Database not configured' }

  if (source === 'applications') {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) return { success: false as const, error: error.message }
    return { success: true as const, row: mapApplicationRecord(data as Record<string, unknown>, 'applications') }
  }

  const { data, error } = await supabaseAdmin
    .from('registrations')
    .update({
      registration_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return { success: false as const, error: error.message }
  return { success: true as const, row: mapApplicationRecord(data as Record<string, unknown>, 'registrations') }
}

export async function acceptAdminApplication(
  id: string,
  source: 'applications' | 'registrations'
) {
  try {
    await requireAdminPermission(PERMISSIONS.APPLICATIONS_APPROVE)
    const result = await updateRowStatus(source, id, 'accepted')
    if (!result.success) return result

    const emailResult = await sendApplicationEmail({
      to: result.row.email,
      full_name: result.row.full_name,
      program: result.row.program || 'Energy & Logics Program',
      status: 'accepted',
    })

    if (!emailResult.success) {
      return { success: false, error: 'Status updated but email failed to send' }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept application',
    }
  }
}

export async function declineAdminApplication(
  id: string,
  source: 'applications' | 'registrations'
) {
  try {
    await requireAdminPermission(PERMISSIONS.APPLICATIONS_APPROVE)
    const result = await updateRowStatus(source, id, 'declined')
    if (!result.success) return result

    const emailResult = await sendApplicationEmail({
      to: result.row.email,
      full_name: result.row.full_name,
      program: result.row.program || 'Energy & Logics Program',
      status: 'declined',
    })

    if (!emailResult.success) {
      return { success: false, error: 'Status updated but email failed to send' }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decline application',
    }
  }
}
