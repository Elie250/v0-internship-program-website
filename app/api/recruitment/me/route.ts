import { NextResponse } from 'next/server'
import {
  getRecruitmentSessionUser,
  isRecruitmentPlatformAdmin,
  listUserMemberships,
} from '@/lib/recruitment/authz'
import { listCandidateApplications } from '@/lib/recruitment/applications'
import {
  calculateProfileCompletion,
  ensureCandidateProfile,
} from '@/lib/recruitment/candidate-profile'
import { listCandidateDocuments } from '@/lib/recruitment/documents'
import { capabilitiesFromState } from '@/lib/recruitment/post-auth'

export async function GET() {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      profileResult,
      memberships,
      applicationsResult,
      documentsResult,
    ] = await Promise.all([
      ensureCandidateProfile(user.id),
      listUserMemberships(user.id),
      listCandidateApplications(user.id),
      listCandidateDocuments(user.id),
    ])

    if (applicationsResult.error) {
      return NextResponse.json(
        { error: `Could not load applications: ${applicationsResult.error}` },
        { status: 500 }
      )
    }
    if (documentsResult.error) {
      return NextResponse.json(
        { error: `Could not load documents: ${documentsResult.error}` },
        { status: 500 }
      )
    }

    const profile = profileResult.profile
    const documents = documentsResult.documents ?? []
    const applications = applicationsResult.applications ?? []
    const completion = calculateProfileCompletion(profile ?? null)
    const latestCv = documents.find((doc) => doc.document_type === 'cv') ?? null
    const isPlatformAdmin = isRecruitmentPlatformAdmin(user)
    const capabilities = capabilitiesFromState({
      hasActiveEmployerMembership: memberships.length > 0,
      isPlatformAdmin,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      candidateProfile: profile ?? null,
      profileCompletion: completion,
      cvStatus: latestCv
        ? { hasCv: true, filename: latestCv.original_filename, uploadedAt: latestCv.created_at }
        : { hasCv: false },
      applications,
      memberships,
      isPlatformAdmin,
      capabilities,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 })
  }
}
