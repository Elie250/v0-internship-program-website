/**
 * External API auth context — Bearer credentials only (never browser sessions).
 */

import { NextResponse } from 'next/server'
import {
  authenticateApiCredential,
  parseBearerCredential,
  type AuthenticatedApiCredential,
} from '@/lib/recruitment/api-credentials'
import { hasScope, type RecruitmentApiScope } from '@/lib/recruitment/api-scopes'
import { checkApiRateLimit } from '@/lib/recruitment/api-rate-limit'
import { createRequestId, writeApiAuditLog } from '@/lib/recruitment/api-audit'
import { getClientIpFromRequest } from '@/lib/recruitment/auth-rate-limit'

export type ExternalApiContext = {
  auth: AuthenticatedApiCredential
  requestId: string
  clientIp: string
}

export function apiError(
  status: number,
  code: string,
  message: string,
  requestId?: string
) {
  return NextResponse.json(
    { error: { code, message, request_id: requestId ?? null } },
    { status }
  )
}

export async function requireExternalApiAuth(
  request: Request,
  requiredScopes: RecruitmentApiScope[] = []
): Promise<ExternalApiContext | NextResponse> {
  const requestId = createRequestId()
  const clientIp = getClientIpFromRequest(request)
  const parsed = parseBearerCredential(request.headers.get('authorization'))
  if (!parsed) {
    await writeApiAuditLog({
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      statusCode: 401,
      success: false,
      errorCode: 'invalid_authorization',
      clientIp,
    })
    return apiError(401, 'unauthorized', 'Missing or invalid Authorization Bearer credentials.', requestId)
  }

  const result = await authenticateApiCredential(parsed.keyId, parsed.secret)
  if ('error' in result) {
    await writeApiAuditLog({
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      statusCode: 401,
      success: false,
      errorCode: 'invalid_credentials',
      clientIp,
    })
    return apiError(401, 'unauthorized', 'Invalid API credentials.', requestId)
  }

  const scopes = (result.credential.scopes ?? []) as RecruitmentApiScope[]
  const auth: AuthenticatedApiCredential = {
    credentialId: result.credential.id,
    organizationId: result.credential.organization_id,
    scopes,
    accessMode: result.credential.access_mode,
    jobIds: result.jobIds,
    keyId: result.credential.key_id,
  }

  for (const scope of requiredScopes) {
    if (!hasScope(auth.scopes, scope)) {
      await writeApiAuditLog({
        organizationId: auth.organizationId,
        credentialId: auth.credentialId,
        requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        statusCode: 403,
        success: false,
        errorCode: 'insufficient_scope',
        clientIp,
      })
      return apiError(
        403,
        'insufficient_scope',
        `Missing required scope: ${scope}`,
        requestId
      )
    }
  }

  const rate = await checkApiRateLimit({
    organizationId: auth.organizationId,
    credentialId: auth.credentialId,
  })
  if (!rate.allowed) {
    await writeApiAuditLog({
      organizationId: auth.organizationId,
      credentialId: auth.credentialId,
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      statusCode: 429,
      success: false,
      errorCode: rate.reason ?? 'rate_limited',
      clientIp,
    })
    const res = apiError(
      429,
      'rate_limited',
      'API rate limit exceeded. Retry after the reset window.',
      requestId
    )
    res.headers.set('Retry-After', '60')
    res.headers.set('X-RateLimit-Remaining', String(rate.remaining))
    res.headers.set('X-RateLimit-Reset', rate.resetAt)
    return res
  }

  return { auth, requestId, clientIp }
}

/** Enforce credential job allow-list when access_mode=restricted. */
export function credentialCanAccessJob(
  auth: AuthenticatedApiCredential,
  jobId: string
): boolean {
  if (auth.accessMode === 'organization') return true
  if (!auth.jobIds || auth.jobIds.length === 0) return false
  return auth.jobIds.includes(jobId)
}

export async function finishApiRequest(
  ctx: ExternalApiContext,
  request: Request,
  response: NextResponse,
  meta?: { resourceType?: string; resourceId?: string; errorCode?: string }
) {
  const status = response.status
  await writeApiAuditLog({
    organizationId: ctx.auth.organizationId,
    credentialId: ctx.auth.credentialId,
    requestId: ctx.requestId,
    method: request.method,
    path: new URL(request.url).pathname,
    statusCode: status,
    success: status >= 200 && status < 400,
    resourceType: meta?.resourceType,
    resourceId: meta?.resourceId,
    errorCode: meta?.errorCode,
    clientIp: ctx.clientIp,
  })
  response.headers.set('X-Request-Id', ctx.requestId)
  return response
}
