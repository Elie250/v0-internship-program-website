import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('course_content')
      .select('*')
      .eq('course_id', id)
      .order('sort_order', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load content'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id: courseId } = await params
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('course_content')
      .insert([
        {
          course_id: courseId,
          title: body.title,
          content_type: body.content_type ?? 'link',
          content_url: body.content_url ?? null,
          sort_order: Number(body.sort_order ?? 0),
        },
      ])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add content'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
