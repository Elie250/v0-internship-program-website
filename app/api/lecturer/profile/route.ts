import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const TEAM_ROLES = new Set(['lecturer', 'instructor', 'support_staff'])

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

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.id || !TEAM_ROLES.has(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const withProfile =
      'id, first_name, last_name, email, phone, role, profile_title, profile_bio, profile_photo_url, show_on_team'
    let { data, error } = await supabaseAdmin.from('users').select(withProfile).eq('id', user.id).maybeSingle()

    if (error?.message?.includes('profile_') || error?.message?.includes('show_on_team')) {
      const fallback = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, phone, role')
        .eq('id', user.id)
        .maybeSingle()
      data = fallback.data
        ? {
            ...fallback.data,
            profile_title: null,
            profile_bio: null,
            profile_photo_url: null,
            show_on_team: false,
          }
        : null
      error = fallback.error
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

    let { data, error } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('id', user.id)
      .select(
        'id, first_name, last_name, email, phone, role, profile_title, profile_bio, profile_photo_url, show_on_team'
      )
      .maybeSingle()

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
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
