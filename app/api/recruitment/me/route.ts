import { NextResponse } from 'next/server'
import {
  getRecruitmentSessionUser,
  isRecruitmentPlatformAdmin,
  listUserMemberships,
} from '@/lib/recruitment/authz'
import { ensureCandidateProfile } from '@/lib/recruitment/candidate-profile'

export async function GET() {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ profile }, memberships] = await Promise.all([
      ensureCandidateProfile(user.id),
      listUserMemberships(user.id),
    ])

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      candidateProfile: profile ?? null,
      memberships,
      isPlatformAdmin: isRecruitmentPlatformAdmin(user),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 })
  }
}
