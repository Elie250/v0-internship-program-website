import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const STUDENT_ACCOUNT_EDITS_SETTING_KEY = 'student_account_edits_open'

export type StudentAccountEditAccess = {
  periodOpen: boolean
  lockedByAdmin: boolean
  canEdit: boolean
  reason: string | null
}

const DENIED_PERIOD =
  'Registration period is closed. An administrator must change your name or password.'
const DENIED_LOCKED =
  'An administrator has locked name and password edits on your account.'

export async function isStudentAccountEditsPeriodOpen(): Promise<boolean> {
  if (!supabaseAdmin) return false
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', STUDENT_ACCOUNT_EDITS_SETTING_KEY)
    .maybeSingle()

  if (error) return false
  if (!data) return true
  return String(data.value).trim().toLowerCase() === 'true'
}

export async function setStudentAccountEditsPeriodOpen(
  open: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { error } = await supabaseAdmin.from('site_settings').upsert(
    {
      key: STUDENT_ACCOUNT_EDITS_SETTING_KEY,
      value: open ? 'true' : 'false',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  )

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getStudentAccountEditAccess(
  userId: string
): Promise<StudentAccountEditAccess> {
  const periodOpen = await isStudentAccountEditsPeriodOpen()

  let lockedByAdmin = false
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('self_edit_locked')
      .eq('id', userId)
      .maybeSingle()

    if (!error) {
      lockedByAdmin = Boolean(data?.self_edit_locked)
    }
    // Missing column until script 67 is applied — treat as unlocked
  }

  if (!periodOpen) {
    return { periodOpen, lockedByAdmin, canEdit: false, reason: DENIED_PERIOD }
  }
  if (lockedByAdmin) {
    return { periodOpen, lockedByAdmin, canEdit: false, reason: DENIED_LOCKED }
  }
  return { periodOpen, lockedByAdmin, canEdit: true, reason: null }
}

export async function setStudentSelfEditLocked(
  userId: string,
  locked: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      self_edit_locked: locked,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    if (error.message.includes('self_edit_locked')) {
      return {
        success: false,
        error:
          'self_edit_locked column is missing. Run scripts/67-student-account-self-edit.sql in Supabase.',
      }
    }
    return { success: false, error: error.message }
  }
  return { success: true }
}
