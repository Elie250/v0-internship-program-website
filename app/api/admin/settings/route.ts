import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { loadWebSettings, saveWebSettings } from '@/lib/platform/site-settings'
import type { WebSettingsForm } from '@/lib/platform/site-settings-schema'

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)
    const settings = await loadWebSettings()
    return NextResponse.json(settings)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)
    const body = (await request.json()) as WebSettingsForm

    if (!body.company_email?.trim() || !body.company_brand_name?.trim()) {
      return NextResponse.json(
        { error: 'Company name and email are required' },
        { status: 400 }
      )
    }

    const result = await saveWebSettings(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Save failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Website settings saved.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
