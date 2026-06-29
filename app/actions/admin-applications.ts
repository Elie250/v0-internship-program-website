'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { sendApplicationEmail } from '@/lib/email'

export type AdminApplicationRow = {
  id: string
  full_name: string
  email: string
  phone?: string | null
  program?: string | null
  duration?: string | null
  registration_type?: string | null
  status: string
  created_at: string
  source: 'applications' | 'registrations'
}

function normalizeStatus(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.toLowerCase()
  return 'pending'
}

function mapApplicationRow(row: Record<string, unknown>): AdminApplicationRow {
  return {
    id: String(row.id),
    full_name: String(row.full_name ?? row.name ?? 'Unknown'),
    email: String(row.email ?? ''),
    phone: (row.phone as string | null) ?? null,
    program: (row.program as string | null) ?? null,
    duration: String(row.duration ?? row.preferred_duration ?? '-'),
    registration_type: (row.registration_type as string | null) ?? 'Program application',
    status: normalizeStatus(row.status),
    created_at: String(row.created_at ?? new Date().toISOString()),
    source: 'applications',
  }
}

function mapRegistrationRow(row: Record<string, unknown>): AdminApplicationRow {
  return {
    id: String(row.id),
    full_name: String(row.full_name ?? row.name ?? 'Unknown'),
    email: String(row.email ?? ''),
    phone: (row.phone as string | null) ?? null,
    program: (row.program ?? row.training_program) as string | null,
    duration: String(row.duration ?? row.preferred_duration ?? row.schedule ?? '-'),
    registration_type: (row.registration_type as string | null) ?? 'Registration',
    status: normalizeStatus(row.registration_status ?? row.status),
    created_at: String(row.created_at ?? new Date().toISOString()),
    source: 'registrations',
  }
}

export async function listAdminApplications(): Promise<{
  success: boolean
  applications?: AdminApplicationRow[]
  registrations?: AdminApplicationRow[]
  error?: string
}> {
  try {
    await requireAdminPermission(PERMISSIONS.APPLICATIONS_VIEW)
    if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

    const [applicationsRes, registrationsRes] = await Promise.all([
      supabaseAdmin.from('applications').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('registrations').select('*').order('created_at', { ascending: false }),
    ])

    if (applicationsRes.error) {
      return { success: false, error: applicationsRes.error.message }
    }
    if (registrationsRes.error) {
      return { success: false, error: registrationsRes.error.message }
    }

    return {
      success: true,
      applications: (applicationsRes.data ?? []).map((row) =>
        mapApplicationRow(row as Record<string, unknown>)
      ),
      registrations: (registrationsRes.data ?? []).map((row) =>
        mapRegistrationRow(row as Record<string, unknown>)
      ),
    }
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
    return { success: true as const, row: mapApplicationRow(data as Record<string, unknown>) }
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
  return { success: true as const, row: mapRegistrationRow(data as Record<string, unknown>) }
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
