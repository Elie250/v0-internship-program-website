import { NextResponse } from 'next/server'
import {
  listEmployerOrganizations,
  resolveEmployerOrganization,
  setActiveEmployerOrganizationCookie,
} from '@/lib/recruitment/employer-context'

export async function GET() {
  try {
    const ctx = await resolveEmployerOrganization()
    return NextResponse.json(ctx)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const organizationId = String(body.organizationId ?? '')
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 })
    }
    const { organizations } = await listEmployerOrganizations()
    if (!organizations.some((org) => org.id === organizationId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await setActiveEmployerOrganizationCookie(organizationId)
    const ctx = await resolveEmployerOrganization(organizationId)
    return NextResponse.json(ctx)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    const status = message === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
