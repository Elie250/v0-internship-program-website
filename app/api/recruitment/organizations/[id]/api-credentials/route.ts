import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { JOB_WRITE_ROLES, roleAllows } from '@/lib/recruitment/rbac'
import {
  createApiCredential,
  listApiCredentials,
  rotateApiCredential,
  setApiCredentialStatus,
} from '@/lib/recruitment/api-credentials'

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
    const { credentials, error } = await listApiCredentials(organizationId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ credentials })
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
    const result = await createApiCredential({
      organizationId,
      name: String(body.name ?? ''),
      scopes: body.scopes,
      accessMode: body.accessMode === 'restricted' ? 'restricted' : 'organization',
      jobIds: Array.isArray(body.jobIds) ? body.jobIds.map(String) : undefined,
      actorUserId: access.user.id,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json(
      {
        credential: result.credential,
        secret: result.secret,
        authorizationHint: result.authorizationHint,
        warning: 'Store this secret now. It will not be shown again.',
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
    const credentialId = String(body.credentialId ?? '')
    const action = String(body.action ?? '')

    if (action === 'rotate') {
      const result = await rotateApiCredential({
        organizationId,
        credentialId,
        actorUserId: access.user.id,
      })
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({
        credential: result.credential,
        secret: result.secret,
        authorizationHint: result.authorizationHint,
        warning: 'Store this secret now. It will not be shown again.',
      })
    }

    if (action === 'revoke' || action === 'activate' || action === 'deactivate') {
      const status =
        action === 'revoke' ? 'revoked' : action === 'activate' ? 'active' : 'inactive'
      const result = await setApiCredentialStatus({
        organizationId,
        credentialId,
        status,
        actorUserId: access.user.id,
      })
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ credential: result.credential })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
