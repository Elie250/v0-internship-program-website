import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import {
  articlePayloadFromBody,
  normalizeEngineeringArticle,
} from '@/lib/engineering/articles'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await context.params
    const body = await request.json()
    const payload = articlePayloadFromBody(body)

    const { data, error } = await supabaseAdmin
      .from('engineering_articles')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

    return NextResponse.json(normalizeEngineeringArticle(data as Record<string, unknown>))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update article'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { id } = await context.params
    const { error } = await supabaseAdmin.from('engineering_articles').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete article'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
