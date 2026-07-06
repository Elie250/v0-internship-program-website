import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { HERO_VIDEO_FILES } from '@/lib/media/hero-videos'

const ALLOWED_NAMES = new Set<string>(HERO_VIDEO_FILES.map((f) => f.file))

/** Upload homepage hero videos to Supabase platform-media/hero/ (fixed filenames, upsert). */
export async function POST(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const results: { file: string; url?: string; error?: string }[] = []

    for (const { file: expectedName } of HERO_VIDEO_FILES) {
      const entry = formData.get(expectedName)
      if (!(entry instanceof File) || entry.size === 0) {
        continue
      }

      if (!ALLOWED_NAMES.has(expectedName)) {
        results.push({ file: expectedName, error: 'Invalid filename' })
        continue
      }

      const contentType =
        expectedName.endsWith('.mov') ? 'video/quicktime' : entry.type || 'video/mp4'
      const storagePath = `hero/${expectedName}`
      const buffer = Buffer.from(await entry.arrayBuffer())

      const { error } = await supabaseAdmin.storage
        .from('platform-media')
        .upload(storagePath, buffer, {
          contentType,
          upsert: true,
        })

      if (error) {
        results.push({ file: expectedName, error: error.message })
        continue
      }

      const { data } = supabaseAdmin.storage.from('platform-media').getPublicUrl(storagePath)
      results.push({ file: expectedName, url: data.publicUrl })
    }

    const uploaded = results.filter((r) => r.url)
    if (!uploaded.length) {
      return NextResponse.json(
        {
          error: 'No video files received. Select at least one MP4/MOV file.',
          results,
        },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? ''
    const baseUrl = supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/platform-media/hero`
      : ''

    return NextResponse.json({
      success: true,
      message: `Uploaded ${uploaded.length} hero video(s) to Supabase storage.`,
      baseUrl,
      results,
      hint: 'Set homepage hero background to /videos/playlist and save settings. Videos load from Supabase automatically when NEXT_PUBLIC_SUPABASE_URL is set on Vercel.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? ''
    const base = supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/platform-media/hero`
      : '/videos'

    const { data: listed } = await supabaseAdmin.storage.from('platform-media').list('hero', {
      limit: 20,
    })
    const namesOnStorage = new Set((listed ?? []).map((o) => o.name))

    const files = HERO_VIDEO_FILES.map(({ file, label }) => {
      const url = `${base}/${file}`
      return { file, label, url, exists: namesOnStorage.has(file) }
    })

    return NextResponse.json({ baseUrl: base, files })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
