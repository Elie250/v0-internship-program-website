import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const TEAM_ROLES = new Set(['lecturer', 'instructor', 'support_staff'])

const PROFILE_SELECT =
  'id, first_name, last_name, email, phone, role, profile_title, profile_bio, profile_photo_url, show_on_team, profile_education, profile_experience, profile_qualifications, profile_cv_url'

type LecturerProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  role: string
  profile_title: string | null
  profile_bio: string | null
  profile_photo_url: string | null
  show_on_team: boolean
  profile_education: string | null
  profile_experience: string | null
  profile_qualifications: string | null
  profile_cv_url: string | null
}

async function getSessionUser() {
  const cookieStore = await cookies()
  const session = cookieStore.get('user_session')
  if (!session?.value) return null
  try {
    return JSON.parse(session.value) as { id: string; role: string }
  } catch {
    return null
  }
}

function withCvDefaults(
  row: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    phone: string | null
    role: string
    profile_title?: string | null
    profile_bio?: string | null
    profile_photo_url?: string | null
    show_on_team?: boolean
  } | null
): LecturerProfileRow | null {
  if (!row) return null
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    profile_title: row.profile_title ?? null,
    profile_bio: row.profile_bio ?? null,
    profile_photo_url: row.profile_photo_url ?? null,
    show_on_team: Boolean(row.show_on_team),
    profile_education: null,
    profile_experience: null,
    profile_qualifications: null,
    profile_cv_url: null,
  }
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.id || !TEAM_ROLES.has(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    let data: LecturerProfileRow | null = null
    const { data: fullRow, error } = await supabaseAdmin
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', user.id)
      .maybeSingle()

    if (
      error?.message?.includes('profile_education') ||
      error?.message?.includes('profile_experience') ||
      error?.message?.includes('profile_qualifications') ||
      error?.message?.includes('profile_cv_url')
    ) {
      const fallback = await supabaseAdmin
        .from('users')
        .select(
          'id, first_name, last_name, email, phone, role, profile_title, profile_bio, profile_photo_url, show_on_team'
        )
        .eq('id', user.id)
        .maybeSingle()

      if (fallback.error?.message?.includes('profile_') || fallback.error?.message?.includes('show_on_team')) {
        const base = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, email, phone, role')
          .eq('id', user.id)
          .maybeSingle()
        data = withCvDefaults(base.data)
        if (base.error || !data) {
          return NextResponse.json({ error: base.error?.message ?? 'Profile not found' }, { status: 404 })
        }
        return NextResponse.json(data)
      }

      data = withCvDefaults(fallback.data as LecturerProfileRow | null)
      if (fallback.error || !data) {
        return NextResponse.json({ error: fallback.error?.message ?? 'Profile not found' }, { status: 404 })
      }
      return NextResponse.json(data)
    }

    if (error?.message?.includes('profile_') || error?.message?.includes('show_on_team')) {
      const base = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, phone, role')
        .eq('id', user.id)
        .maybeSingle()
      data = withCvDefaults(base.data)
      if (base.error || !data) {
        return NextResponse.json({ error: base.error?.message ?? 'Profile not found' }, { status: 404 })
      }
      return NextResponse.json(data)
    }

    data = (fullRow as LecturerProfileRow | null) ?? null
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
    if (!user?.id || !TEAM_ROLES.has(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.profileTitle !== undefined) {
      payload.profile_title = String(body.profileTitle ?? '').trim() || null
    }
    if (body.profileBio !== undefined) {
      payload.profile_bio = String(body.profileBio ?? '').trim() || null
    }
    if (body.profilePhotoUrl !== undefined) {
      payload.profile_photo_url = String(body.profilePhotoUrl ?? '').trim() || null
    }
    if (body.showOnTeam !== undefined) {
      payload.show_on_team = Boolean(body.showOnTeam)
    }
    if (body.profileEducation !== undefined) {
      payload.profile_education = String(body.profileEducation ?? '').trim() || null
    }
    if (body.profileExperience !== undefined) {
      payload.profile_experience = String(body.profileExperience ?? '').trim() || null
    }
    if (body.profileQualifications !== undefined) {
      payload.profile_qualifications = String(body.profileQualifications ?? '').trim() || null
    }
    if (body.profileCvUrl !== undefined) {
      payload.profile_cv_url = String(body.profileCvUrl ?? '').trim() || null
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('id', user.id)
      .select(PROFILE_SELECT)
      .maybeSingle()

    if (
      error?.message?.includes('profile_education') ||
      error?.message?.includes('profile_experience') ||
      error?.message?.includes('profile_qualifications') ||
      error?.message?.includes('profile_cv_url')
    ) {
      return NextResponse.json(
        {
          error:
            'CV profile columns are not in the database yet. Run scripts/46-lecturer-cv-profile.sql in Supabase.',
        },
        { status: 500 }
      )
    }

    if (error?.message?.includes('profile_') || error?.message?.includes('show_on_team')) {
      return NextResponse.json(
        {
          error:
            'Team profile columns are not in the database yet. Run scripts/42-team-profiles.sql in Supabase.',
        },
        { status: 500 }
      )
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data as LecturerProfileRow)
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
