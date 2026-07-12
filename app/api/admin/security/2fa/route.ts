import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { buildTotpUri, generateTotpSecret, verifyTotpCode } from '@/lib/auth/totp'
import { logAdminAction } from '@/lib/admin/audit-log'

export async function GET() {
  try {
    const session = await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('totp_enabled')
      .eq('id', session.user.id)
      .maybeSingle()

    if (error?.message?.includes('totp_enabled')) {
      return NextResponse.json({ enabled: false, supported: false })
    }

    return NextResponse.json({ enabled: Boolean(data?.totp_enabled), supported: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const step = String(body.step ?? '')

    if (step === 'setup') {
      const secret = generateTotpSecret()
      return NextResponse.json({
        secret,
        otpUri: buildTotpUri(secret, session.user.email),
      })
    }

    if (step === 'confirm') {
      const secret = String(body.secret ?? '')
      const code = String(body.code ?? '')
      if (!secret || !verifyTotpCode(secret, code)) {
        return NextResponse.json({ error: 'Invalid authenticator code' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ totp_secret: secret, totp_enabled: true })
        .eq('id', session.user.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await logAdminAction({
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        action: 'enable_2fa',
        module: 'security',
        summary: 'Enabled two-factor authentication',
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const code = String(body.code ?? '')

    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('totp_secret, totp_enabled')
      .eq('id', session.user.id)
      .maybeSingle()

    if (fetchError || !user?.totp_secret || !verifyTotpCode(String(user.totp_secret), code)) {
      return NextResponse.json({ error: 'Invalid authenticator code' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ totp_secret: null, totp_enabled: false })
      .eq('id', session.user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAdminAction({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      action: 'disable_2fa',
      module: 'security',
      summary: 'Disabled two-factor authentication',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
