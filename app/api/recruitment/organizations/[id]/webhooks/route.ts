import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { JOB_WRITE_ROLES, roleAllows } from '@/lib/recruitment/rbac'
import {
  createWebhook,
  listWebhooks,
  rotateWebhookSecret,
  setWebhookStatus,
} from '@/lib/recruitment/api-webhooks'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, JOB_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, JOB_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { webhooks, error } = await listWebhooks(organizationId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ webhooks })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, JOB_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, JOB_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const result = await createWebhook({
      organizationId,
      name: String(body.name ?? ''),
      targetUrl: String(body.targetUrl ?? body.target_url ?? ''),
      events: body.events,
      actorUserId: access.user.id,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json(
      {
        webhook: result.webhook,
        signingSecret: result.signingSecret,
        warning: 'Store this signing secret now. It will not be shown again.',
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, JOB_WRITE_ROLES)
    if (!roleAllows(access.asPlatformAdmin, access.membership?.role, JOB_WRITE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const webhookId = String(body.webhookId ?? '')
    const action = String(body.action ?? '')

    if (action === 'rotate_secret') {
      const result = await rotateWebhookSecret({
        organizationId,
        webhookId,
        actorUserId: access.user.id,
      })
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({
        webhook: result.webhook,
        signingSecret: result.signingSecret,
        warning: 'Store this signing secret now. It will not be shown again.',
      })
    }

    if (action === 'revoke' || action === 'activate' || action === 'deactivate') {
      const status =
        action === 'revoke' ? 'revoked' : action === 'activate' ? 'active' : 'inactive'
      const result = await setWebhookStatus({
        organizationId,
        webhookId,
        status,
        actorUserId: access.user.id,
      })
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ webhook: result.webhook })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
