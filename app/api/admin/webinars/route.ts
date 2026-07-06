import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('webinars')
      .select('*')
      .order('scheduled_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load webinars'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

async function resolveHost(hostUserId: string | null) {
  if (!hostUserId || !supabaseAdmin) {
    return { host_user_id: null, host_name: null, host_role: null }
  }
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, email, role')
    .eq('id', hostUserId)
    .maybeSingle()
  if (!data) return { host_user_id: null, host_name: null, host_role: null }
  return {
    host_user_id: data.id,
    host_name: [data.first_name, data.last_name].filter(Boolean).join(' ') || data.email,
    host_role: String(data.role),
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const isPaid = Boolean(body.is_paid)
    const price = isPaid ? Math.max(0, Number(body.price ?? 0)) : 0
    const host = await resolveHost(body.host_user_id ? String(body.host_user_id) : null)

    const { data, error } = await supabaseAdmin
      .from('webinars')
      .insert([
        {
          title: body.title,
          description: body.description ?? null,
          scheduled_at: body.scheduled_at || null,
          meeting_link: body.meeting_link || null,
          recording_url: body.recording_url || null,
          status: body.status ?? 'draft',
          is_paid: isPaid,
          price,
          ...host,
        },
      ])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create webinar'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
