import { NextResponse } from 'next/server'
import { checkUserPermission, getCurrentUser } from '@/app/actions/auth-service'
import { PERMISSIONS } from '@/lib/admin/permissions'
import {
  diagnoseBrainGamesCatalog,
  listBrainGamesCatalogWithSeed,
  updateBrainGameRow,
  upsertStaticBrainGamesCatalog,
} from '@/lib/brain-training/admin-catalog'

async function requireBrainGamesAccess(): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  const user = await getCurrentUser()
  if (!user?.id) return { ok: false, status: 401, error: 'Login required' }
  if (user.role === 'admin') return { ok: true }
  const allowed = await checkUserPermission(user.id, PERMISSIONS.CONTENT_ANNOUNCEMENTS)
  if (!allowed) return { ok: false, status: 403, error: 'Forbidden' }
  return { ok: true }
}

/** GET ?diagnose=1 → diagnostics only; otherwise list (+ auto-seed if empty). */
export async function GET(request: Request) {
  try {
    const auth = await requireBrainGamesAccess()
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error, games: [] }, { status: auth.status })
    }

    const diagnoseOnly = new URL(request.url).searchParams.get('diagnose') === '1'
    if (diagnoseOnly) {
      const report = await diagnoseBrainGamesCatalog()
      return NextResponse.json({ success: true, report })
    }

    const result = await listBrainGamesCatalogWithSeed()
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        games: [],
        error: error instanceof Error ? error.message : 'Failed to load brain games',
      },
      { status: 500 }
    )
  }
}

/** POST { action: 'seed' } or PATCH body for updates. */
export async function POST(request: Request) {
  try {
    const auth = await requireBrainGamesAccess()
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: string
      id?: string
      name?: string
      description?: string
      short_tagline?: string
      thumbnail_url?: string | null
      is_active?: boolean
      sort_order?: number
      estimated_minutes?: number
    }

    if (body.action === 'seed' || body.action === 'sync') {
      const seed = await upsertStaticBrainGamesCatalog()
      if (!seed.ok) {
        const report = await diagnoseBrainGamesCatalog()
        return NextResponse.json(
          { success: false, error: seed.error, report },
          { status: 500 }
        )
      }
      const listed = await listBrainGamesCatalogWithSeed()
      return NextResponse.json({
        success: true,
        count: seed.count,
        games: listed.games,
        report: listed.report,
      })
    }

    if (body.id) {
      const updated = await updateBrainGameRow({
        id: body.id,
        name: body.name,
        description: body.description,
        short_tagline: body.short_tagline,
        thumbnail_url: body.thumbnail_url,
        is_active: body.is_active,
        sort_order: body.sort_order,
        estimated_minutes: body.estimated_minutes,
      })
      if (!updated.success) {
        return NextResponse.json(updated, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Brain games request failed',
      },
      { status: 500 }
    )
  }
}
