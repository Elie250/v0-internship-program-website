import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import {
  buildProfileSnapshot,
  listCandidateApplications,
  submitApplication,
  withdrawApplication,
} from '@/lib/recruitment/applications'
import { ensureCandidateProfile } from '@/lib/recruitment/candidate-profile'
import { sendApplicationSubmittedEmail } from '@/lib/recruitment/email-notifications'

export async function GET() {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { applications, error } = await listCandidateApplications(user.id)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ applications })
  } catch {
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const jobId = String(body.jobId ?? '')
    const cvDocumentId = String(body.cvDocumentId ?? '')
    if (!jobId || !cvDocumentId) {
      return NextResponse.json({ error: 'jobId and cvDocumentId are required' }, { status: 400 })
    }

    const { profile, error: profileError } = await ensureCandidateProfile(user.id)
    if (profileError || !profile) {
      return NextResponse.json({ error: profileError ?? 'Profile required' }, { status: 400 })
    }

    const profileSnapshot = buildProfileSnapshot({
      profile,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    const result = await submitApplication({
      jobId,
      candidateUserId: user.id,
      cvDocumentId,
      profileSnapshot,
      actorUserId: user.id,
    })

    if (result.error || !result.application) {
      return NextResponse.json({ error: result.error ?? 'Application failed' }, { status: 400 })
    }

    void sendApplicationSubmittedEmail({
      candidateEmail: user.email,
      candidateName: profileSnapshot.full_name,
      jobTitle: result.jobTitle ?? 'Role',
      organizationName: result.organizationName ?? 'Employer',
      organizationNotificationEmail: result.organizationNotificationEmail,
      applicationId: result.application.id,
      cvDocumentId: result.application.cv_document_id,
      candidate: {
        email: profileSnapshot.email || user.email,
        phone: profileSnapshot.phone,
        location: profileSnapshot.location,
        headline: profileSnapshot.headline,
        linkedinUrl: profileSnapshot.linkedin_url,
        portfolioUrl: profileSnapshot.portfolio_url,
        githubUrl: profileSnapshot.github_url,
        summary: profileSnapshot.summary,
        skills: profileSnapshot.skills,
      },
    })

    return NextResponse.json({ application: result.application })
  } catch {
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const applicationId = String(body.applicationId ?? '')
    const action = String(body.action ?? '')
    if (!applicationId || action !== 'withdraw') {
      return NextResponse.json({ error: 'Invalid withdrawal request' }, { status: 400 })
    }

    const result = await withdrawApplication({
      applicationId,
      candidateUserId: user.id,
      actorUserId: user.id,
    })

    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ application: result.application })
  } catch {
    return NextResponse.json({ error: 'Failed to withdraw application' }, { status: 500 })
  }
}
