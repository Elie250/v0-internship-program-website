import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { HERO_VIDEO_FILES } from '@/lib/media/hero-videos'

const ALLOWED_NAMES = new Set(HERO_VIDEO_FILES.map((f) => f.file))

/** Return a signed upload URL so large hero videos upload directly to Supabase (bypasses Vercel size limits). */
export async function POST(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const file = String(body.file ?? '')
    if (!ALLOWED_NAMES.has(file)) {
      return NextResponse.json({ error: 'Invalid hero video filename' }, { status: 400 })
    }

    const path = `hero/${file}`
    const { data, error } = await supabaseAdmin.storage
      .from('platform-media')
      .createSignedUploadUrl(path)

    if (error || !data) {
      return NextResponse.json(
        {
          error: error?.message ?? 'Could not create upload URL',
          hint: 'Run scripts/34-hero-video-storage.sql and ensure the platform-media bucket exists.',
        },
        { status: 500 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? ''
    const publicUrl = supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/platform-media/${path}`
      : ''

    return NextResponse.json({
      file,
      path: data.path,
      token: data.token,
      publicUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
