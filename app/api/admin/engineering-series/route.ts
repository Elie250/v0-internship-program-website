import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import {
  normalizeEngineeringSeries,
  seriesPayloadFromBody,
} from '@/lib/engineering/series'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('engineering_article_series')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error?.message?.includes('engineering_article_series')) {
      return NextResponse.json(
        { error: 'Run scripts/49-engineering-blog-phase3.sql in Supabase.' },
        { status: 500 }
      )
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(
      (data ?? []).map((row) => normalizeEngineeringSeries(row as Record<string, unknown>))
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load series'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const payload = seriesPayloadFromBody(body)
    if (!payload.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('engineering_article_series')
      .insert([payload])
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(normalizeEngineeringSeries(data as Record<string, unknown>), {
      status: 201,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create series'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
