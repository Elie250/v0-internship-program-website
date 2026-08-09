import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { refreshSessionForUser } from '@/app/actions/auth-service'
import { getStudentAccountEditAccess } from '@/lib/student/account-self-edit'

const PROFILE_SELECT =
  'id, first_name, last_name, email, phone, role, profile_photo_url, parent_guardian_name, parent_guardian_phone, parent_guardian_email, parent_guardian_relationship'

type StudentProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  role: string
  profile_photo_url: string | null
  parent_guardian_name: string | null
  parent_guardian_phone: string | null
  parent_guardian_email: string | null
  parent_guardian_relationship: string | null
}

async function getSessionUser() {
  const cookieStore = await cookies()
  const session = cookieStore.get('user_session')
  if (!session?.value) return null
  try {
    return JSON.parse(session.value) as { id: string; role?: string }
  } catch {
    return null
  }
}

function withParentDefaults(
  row: Omit<
    StudentProfileRow,
    'parent_guardian_name' | 'parent_guardian_phone' | 'parent_guardian_email' | 'parent_guardian_relationship'
  > | null
): StudentProfileRow | null {
  if (!row) return null
  return {
    ...row,
    profile_photo_url: row.profile_photo_url ?? null,
    parent_guardian_name: null,
    parent_guardian_phone: null,
    parent_guardian_email: null,
    parent_guardian_relationship: null,
  }
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    let data: StudentProfileRow | null = null
    let { data: fullRow, error } = await supabaseAdmin
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', user.id)
      .maybeSingle()

    if (
      error?.message?.includes('parent_guardian') ||
      error?.message?.includes('profile_photo')
    ) {
      const fallback = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, phone, role, profile_photo_url')
        .eq('id', user.id)
        .maybeSingle()
      data = withParentDefaults(fallback.data as StudentProfileRow | null)
      error = fallback.error
    } else {
      data = (fullRow as StudentProfileRow | null) ?? null
    }

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Profile not found' }, { status: 404 })
    }

    const accountEdit = await getStudentAccountEditAccess(user.id)
    return NextResponse.json({ ...data, accountEdit })
  } catch {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    const wantsNameChange = body.firstName !== undefined || body.lastName !== undefined
    const newPassword = String(body.newPassword ?? '').trim()
    const wantsPasswordChange = Boolean(newPassword)

    if (wantsNameChange || wantsPasswordChange) {
      const access = await getStudentAccountEditAccess(user.id)
      if (!access.canEdit) {
        return NextResponse.json(
          { error: access.reason ?? 'Name and password edits are not allowed.' },
          { status: 403 }
        )
      }
    }

    if (wantsNameChange) {
      const firstName = String(body.firstName ?? '').trim()
      const lastName = String(body.lastName ?? '').trim()
      if (!firstName || !lastName) {
        return NextResponse.json(
          { error: 'First name and last name are required.' },
          { status: 400 }
        )
      }
      payload.first_name = firstName
      payload.last_name = lastName
    }

    if (wantsPasswordChange) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters.' },
          { status: 400 }
        )
      }
      const currentPassword = String(body.currentPassword ?? '')
      const { data: authRow, error: authError } = await supabaseAdmin
        .from('users')
        .select('password_hash')
        .eq('id', user.id)
        .maybeSingle()

      if (authError || !authRow?.password_hash) {
        return NextResponse.json({ error: 'Could not verify current password.' }, { status: 500 })
      }

      const stored = String(authRow.password_hash)
      const matches =
        stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')
          ? await bcrypt.compare(currentPassword, stored)
          : currentPassword === stored

      if (!matches) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
      }

      payload.password_hash = await bcrypt.hash(newPassword, 10)
    }

    if (body.phone !== undefined) {
      payload.phone = String(body.phone ?? '').trim() || null
    }
    if (body.profilePhotoUrl !== undefined) {
      payload.profile_photo_url = String(body.profilePhotoUrl ?? '').trim() || null
    }
    if (body.parentGuardianName !== undefined) {
      payload.parent_guardian_name = String(body.parentGuardianName ?? '').trim() || null
    }
    if (body.parentGuardianPhone !== undefined) {
      payload.parent_guardian_phone = String(body.parentGuardianPhone ?? '').trim() || null
    }
    if (body.parentGuardianEmail !== undefined) {
      payload.parent_guardian_email = String(body.parentGuardianEmail ?? '').trim() || null
    }
    if (body.parentGuardianRelationship !== undefined) {
      payload.parent_guardian_relationship =
        String(body.parentGuardianRelationship ?? '').trim() || null
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('id', user.id)
      .select(PROFILE_SELECT)
      .maybeSingle()

    if (error?.message?.includes('parent_guardian')) {
      return NextResponse.json(
        {
          error:
            'Parent/guardian columns are not in the database yet. Run scripts/45-student-profile.sql in Supabase.',
        },
        { status: 500 }
      )
    }

    if (error?.message?.includes('profile_photo')) {
      return NextResponse.json(
        {
          error:
            'Profile photo column is not in the database yet. Run scripts/42-team-profiles.sql in Supabase.',
        },
        { status: 500 }
      )
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (wantsNameChange && data) {
      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
      await supabaseAdmin
        .from('students')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('email', data.email)
        .then(() => undefined)
        .catch(() => undefined)
      await refreshSessionForUser(user.id)
    }

    const accountEdit = await getStudentAccountEditAccess(user.id)
    return NextResponse.json({ ...(data as StudentProfileRow), accountEdit })
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
