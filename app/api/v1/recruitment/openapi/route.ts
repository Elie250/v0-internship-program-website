import { NextResponse } from 'next/server'
import { finishApiRequest, requireExternalApiAuth } from '@/lib/recruitment/api-auth'
import { RECRUITMENT_API_DOCS } from '@/lib/recruitment/api-docs'

/** Machine-readable API documentation (requires any valid credential). */
export async function GET(request: Request) {
  const authResult = await requireExternalApiAuth(request, [])
  if (authResult instanceof NextResponse) return authResult
  return finishApiRequest(
    authResult,
    request,
    NextResponse.json({
      data: RECRUITMENT_API_DOCS,
      request_id: authResult.requestId,
    })
  )
}
