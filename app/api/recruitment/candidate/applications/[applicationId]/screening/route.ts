import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { getCandidateScreeningEligibility } from '@/lib/recruitment/screening-sessions'

export async function GET(
  _request: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { applicationId } = await context.params
    const result = await getCandidateScreeningEligibility(applicationId, user.id)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }
    return NextResponse.json({
      eligible: result.eligible,
      canStart: result.canStart,
      reason: result.reason,
      attemptsUsed: result.attemptsUsed,
      maxAttempts: result.maxAttempts,
      config: result.config
        ? {
            durationMinutes: result.config.duration_minutes,
            questionCount: result.config.question_count,
            passingScore: result.config.passing_score,
            attemptPolicy: result.config.attempt_policy,
          }
        : null,
      jobTitle: result.job?.title ?? null,
      activeSessionId: result.activeSession?.id ?? null,
      latestSession: result.latestSession
        ? {
            id: result.latestSession.id,
            status: result.latestSession.status,
            technicalScore: result.latestSession.technical_score,
            passed: result.latestSession.passed,
            completionState: result.latestSession.completion_state,
            submittedAt: result.latestSession.submitted_at,
          }
        : null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load screening status' }, { status: 500 })
  }
}
