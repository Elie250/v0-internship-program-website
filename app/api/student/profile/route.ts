import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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

    return NextResponse.json(data)
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
    return NextResponse.json(data as StudentProfileRow)
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
