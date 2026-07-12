import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { displayNameFromUser } from '@/lib/learning/display-creator'
import {
  articlePayloadFromBody,
  normalizeEngineeringArticle,
} from '@/lib/engineering/articles'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('engineering_articles')
      .select('*')
      .order('updated_at', { ascending: false })

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

    return NextResponse.json(
      (data ?? []).map((row) => normalizeEngineeringArticle(row as Record<string, unknown>))
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load articles'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminPermission(PERMISSIONS.CONTENT_ANNOUNCEMENTS)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const authorName =
      String(body.author_name ?? '').trim() ||
      displayNameFromUser({
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
      })

    const payload = articlePayloadFromBody(body, {
      id: session.user.id,
      name: authorName,
    })

    if (!payload.title || !payload.body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create article'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
