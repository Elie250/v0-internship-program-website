import { NextResponse } from 'next/server'
import { getOrganizationBySlug } from '@/lib/recruitment/organizations'

/** Public org card for future /o/{slug} — active orgs only, no confidential data. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const { organization, error } = await getOrganizationBySlug(slug)
    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!organization || organization.status !== 'active') {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      organization: {
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        logo_url: organization.logo_url,
        careers_blurb: organization.careers_blurb,
      },
      poweredBy: 'Energy & Logics',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load organization' }, { status: 500 })
  }
}
