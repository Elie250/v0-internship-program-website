import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const PROFILE_SELECT =
  'id, first_name, last_name, email, phone, role, profile_title, profile_bio, profile_photo_url, profile_education, profile_experience, profile_qualifications, profile_cv_url'

type EngineerProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  role: string
  profile_title: string | null
  profile_bio: string | null
  profile_photo_url: string | null
  profile_education: string | null
  profile_experience: string | null
  profile_qualifications: string | null
  profile_cv_url: string | null
}

async function getSessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; role?: string }
  } catch {
    return null
  }
}

function withDefaults(row: Record<string, unknown> | null): EngineerProfileRow | null {
  if (!row) return null
  return {
    id: String(row.id),
    first_name: row.first_name != null ? String(row.first_name) : null,
    last_name: row.last_name != null ? String(row.last_name) : null,
    email: String(row.email ?? ''),
    phone: row.phone != null ? String(row.phone) : null,
    role: String(row.role ?? 'engineer'),
    profile_title: row.profile_title != null ? String(row.profile_title) : null,
    profile_bio: row.profile_bio != null ? String(row.profile_bio) : null,
    profile_photo_url: row.profile_photo_url != null ? String(row.profile_photo_url) : null,
    profile_education: row.profile_education != null ? String(row.profile_education) : null,
    profile_experience: row.profile_experience != null ? String(row.profile_experience) : null,
    profile_qualifications: row.profile_qualifications != null ? String(row.profile_qualifications) : null,
    profile_cv_url: row.profile_cv_url != null ? String(row.profile_cv_url) : null,
  }
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.id || user.role !== 'engineer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: fullRow, error: fullError } = await supabaseAdmin
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', user.id)
      .maybeSingle()

    let row: Record<string, unknown> | null = (fullRow as Record<string, unknown> | null) ?? null
    let error = fullError

    if (error?.message?.includes('profile_')) {
      const fallback = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, phone, role, profile_photo_url')
        .eq('id', user.id)
        .maybeSingle()
      row = (fallback.data as Record<string, unknown> | null) ?? null
      error = fallback.error
    }

    if (error || !row) {
      return NextResponse.json({ error: error?.message ?? 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(withDefaults(row))
  } catch {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user?.id || user.role !== 'engineer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.first_name !== undefined) updates.first_name = String(body.first_name ?? '').trim() || null
    if (body.last_name !== undefined) updates.last_name = String(body.last_name ?? '').trim() || null
    if (body.phone !== undefined) updates.phone = String(body.phone ?? '').trim() || null
    if (body.profile_title !== undefined) {
      updates.profile_title = String(body.profile_title ?? '').trim() || null
    }
    if (body.profile_bio !== undefined) {
      updates.profile_bio = String(body.profile_bio ?? '').trim() || null
    }
    if (body.profile_photo_url !== undefined) {
      updates.profile_photo_url = String(body.profile_photo_url ?? '').trim() || null
    }
    if (body.profile_education !== undefined) {
      updates.profile_education = String(body.profile_education ?? '').trim() || null
    }
    if (body.profile_experience !== undefined) {
      updates.profile_experience = String(body.profile_experience ?? '').trim() || null
    }
    if (body.profile_qualifications !== undefined) {
      updates.profile_qualifications = String(body.profile_qualifications ?? '').trim() || null
    }
    if (body.profile_cv_url !== undefined) {
      updates.profile_cv_url = String(body.profile_cv_url ?? '').trim() || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select(PROFILE_SELECT)
      .single()

    if (error?.message?.includes('profile_')) {
      const safe: Record<string, unknown> = {}
      if (updates.first_name !== undefined) safe.first_name = updates.first_name
      if (updates.last_name !== undefined) safe.last_name = updates.last_name
      if (updates.phone !== undefined) safe.phone = updates.phone
      if (updates.profile_photo_url !== undefined) safe.profile_photo_url = updates.profile_photo_url

      const fallback = await supabaseAdmin
        .from('users')
        .update(safe)
        .eq('id', user.id)
        .select('id, first_name, last_name, email, phone, role, profile_photo_url')
        .single()

      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 400 })
      }
      return NextResponse.json(withDefaults(fallback.data as Record<string, unknown>))
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(withDefaults(data as Record<string, unknown>))
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
