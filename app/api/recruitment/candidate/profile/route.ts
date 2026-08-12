import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import {
  ensureCandidateProfile,
  updateCandidateProfile,
} from '@/lib/recruitment/candidate-profile'

export async function GET() {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { profile, error } = await ensureCandidateProfile(user.id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await updateCandidateProfile({
      userId: user.id,
      headline: body.headline,
      phone: body.phone,
      location: body.location,
      linkedinUrl: body.linkedinUrl,
      portfolioUrl: body.portfolioUrl,
      summary: body.summary,
      consentPrivacy: body.consentPrivacy === true,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ profile: result.profile })
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
