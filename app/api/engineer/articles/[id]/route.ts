import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  articlePayloadFromBody,
  normalizeEngineeringArticle,
} from '@/lib/engineering/articles'

const AUTHOR_ROLES = new Set(['engineer', 'lecturer', 'instructor', 'support_staff', 'admin'])

async function getAuthorSession() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; role: string }
  } catch {
    return null
  }
}

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthorSession()
  if (!user?.id || !AUTHOR_ROLES.has(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await context.params
  const body = await request.json()
  const payload = articlePayloadFromBody(body)

  if (user.role === 'engineer') {
    payload.status = 'draft'
    payload.published_at = null
  }

  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .update(payload)
    .eq('id', id)
    .eq('author_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

  return NextResponse.json(normalizeEngineeringArticle(data as Record<string, unknown>))
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getAuthorSession()
  if (!user?.id || !AUTHOR_ROLES.has(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await context.params
  const { error } = await supabaseAdmin
    .from('engineering_articles')
    .delete()
    .eq('id', id)
    .eq('author_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
