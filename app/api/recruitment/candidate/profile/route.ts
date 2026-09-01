import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import {
  ensureCandidateProfile,
  updateCandidateAccountName,
  updateCandidateProfile,
} from '@/lib/recruitment/candidate-profile'
import { refreshSessionForUser } from '@/app/actions/auth-service'

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
      githubUrl: body.githubUrl,
      summary: body.summary,
      skills: body.skills,
      education: body.education,
      experience: body.experience,
      consentPrivacy: body.consentPrivacy === true,
      actorUserId: user.id,
    })
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })

    let firstName: string | undefined
    let lastName: string | undefined
    if (body.firstName !== undefined || body.lastName !== undefined) {
      const names = await updateCandidateAccountName({
        userId: user.id,
        firstName: body.firstName,
        lastName: body.lastName,
      })
      if (names.error) return NextResponse.json({ error: names.error }, { status: 400 })
      firstName = names.firstName
      lastName = names.lastName
      await refreshSessionForUser(user.id)
    }

    return NextResponse.json({
      profile: result.profile,
      ...(firstName !== undefined || lastName !== undefined ? { firstName, lastName } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
