import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentUser } from '@/app/actions/auth-service'

export async function GET() {
  const user = await getCurrentUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('alumni_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error?.message?.includes('alumni_profiles')) {
    return NextResponse.json(null)
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json(null)

  return NextResponse.json({
    programmeTitle: data.programme_title,
    graduationYear: data.graduation_year,
    headline: data.headline,
    bio: data.bio,
    linkedinUrl: data.linkedin_url,
    isPublic: Boolean(data.is_public),
  })
}

export async function PUT(request: Request) {
  const user = await getCurrentUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const body = await request.json()
  const payload = {
    user_id: user.id,
    programme_title: String(body.programmeTitle ?? '').trim() || null,
    graduation_year: body.graduationYear ? Number(body.graduationYear) : null,
    headline: String(body.headline ?? '').trim() || null,
    bio: String(body.bio ?? '').trim() || null,
    linkedin_url: String(body.linkedinUrl ?? '').trim() || null,
    is_public: Boolean(body.isPublic),
    updated_at: new Date().toISOString(),
  }

  const { data: existing } = await supabaseAdmin
    .from('alumni_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const query = existing?.id
    ? supabaseAdmin.from('alumni_profiles').update(payload).eq('id', existing.id)
    : supabaseAdmin.from('alumni_profiles').insert(payload)

  const { error } = await query
  if (error?.message?.includes('alumni_profiles')) {
    return NextResponse.json(
      { error: 'Alumni profiles not set up yet. Run scripts/60-alumni-profiles.sql in Supabase.' },
      { status: 500 }
    )
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
