import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { HERO_VIDEO_FILES } from '@/lib/media/hero-videos'
import {
  getHeroVideosPublicBaseUrl,
  uploadHeroVideoFile,
} from '@/lib/storage/hero-video-upload'
import { listObjectNames, objectExists, storageConfigHint, storageConfigured } from '@/lib/storage/object-storage'

const ALLOWED_NAMES = new Set<string>(HERO_VIDEO_FILES.map((f) => f.file))

/** Upload homepage hero videos to Cloudflare R2 hero/ (fixed filenames, upsert). */
export async function POST(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)

    if (!storageConfigured()) {
      return NextResponse.json({ error: 'Storage not configured', hint: storageConfigHint() }, { status: 500 })
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
      const buffer = Buffer.from(await entry.arrayBuffer())

      const uploaded = await uploadHeroVideoFile(expectedName, buffer, contentType)
      if (!uploaded.ok) {
        results.push({ file: expectedName, error: uploaded.error })
        continue
      }

      results.push({ file: expectedName, url: uploaded.url })
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

    const baseUrl = getHeroVideosPublicBaseUrl()

    return NextResponse.json({
      success: true,
      message: `Uploaded ${uploaded.length} hero video(s) to media storage.`,
      baseUrl,
      results,
      hint: 'Homepage hero videos load from your R2 custom domain when R2_PUBLIC_BASE_URL is set on Vercel.',
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

    if (!storageConfigured()) {
      return NextResponse.json({ error: 'Storage not configured', hint: storageConfigHint() }, { status: 500 })
    }

    const base = getHeroVideosPublicBaseUrl()
    const namesOnStorage = new Set(await listObjectNames('hero/'))

    const files = await Promise.all(
      HERO_VIDEO_FILES.map(async ({ file, label }) => {
        const exists =
          namesOnStorage.has(file) || (await objectExists(`hero/${file}`))
        const url = `${base}/${file}`
        return { file, label, url, exists }
      })
    )

    return NextResponse.json({ baseUrl: base, files })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
