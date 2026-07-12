import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const body = await request.json()
  const fullName = String(body.fullName ?? '').trim()
  const email = String(body.email ?? '').trim()
  const phone = String(body.phone ?? '').trim() || null
  const focusArea = String(body.focusArea ?? '').trim()
  const message = String(body.message ?? '').trim() || null

  if (!fullName || !email || !focusArea) {
    return NextResponse.json({ error: 'Name, email, and focus area are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('mentor_match_requests')
    .insert({
      full_name: fullName,
      email,
      phone,
      focus_area: focusArea,
      message,
    })
    .select('id')
    .single()

  if (error?.message?.includes('mentor_match_requests')) {
    return NextResponse.json(
      { error: 'Mentor matching is not set up yet. Run scripts/59-mentor-matching.sql in Supabase.' },
      { status: 500 }
    )
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, id: data.id }, { status: 201 })
}
