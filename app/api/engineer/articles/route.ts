import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { displayNameFromUser } from '@/lib/learning/display-creator'
import {
  articlePayloadFromBody,
  normalizeEngineeringArticle,
} from '@/lib/engineering/articles'

const AUTHOR_ROLES = new Set(['engineer', 'lecturer', 'instructor', 'support_staff', 'admin'])

async function getAuthorSession() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as {
      id: string
      role: string
      firstName?: string
      lastName?: string
      email?: string
    }
  } catch {
    return null
  }
}

export async function GET() {
  const user = await getAuthorSession()
  if (!user?.id || !AUTHOR_ROLES.has(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .select('*')
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  if (error?.message?.includes('engineering_articles')) {
    return NextResponse.json([])
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(
    (data ?? []).map((row) => normalizeEngineeringArticle(row as Record<string, unknown>))
  )
}

export async function POST(request: Request) {
  const user = await getAuthorSession()
  if (!user?.id || !AUTHOR_ROLES.has(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const body = await request.json()
  const authorName = displayNameFromUser(user)
  const payload = articlePayloadFromBody(body, { id: user.id, name: authorName })

  if (!payload.title || !payload.body) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
  }

  // Engineers submit drafts; admins can publish from the dashboard.
  if (user.role === 'engineer' && payload.status === 'published') {
    payload.status = 'draft'
    payload.published_at = null
  }

  const { data, error } = await supabaseAdmin
    .from('engineering_articles')
    .insert([payload])
    .select('*')
    .single()

  if (error?.message?.includes('engineering_articles')) {
    return NextResponse.json(
      {
        error:
          'Engineering articles table not found. Run scripts/47-engineering-blog.sql in Supabase.',
      },
      { status: 500 }
    )
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(normalizeEngineeringArticle(data as Record<string, unknown>), {
    status: 201,
  })
}
