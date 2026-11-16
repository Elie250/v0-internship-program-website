import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  getPracticalAssessment,
  getPracticalArtifactSignedUrl,
} from '@/lib/learning/practical-assessment-service'

async function sessionUser() {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string }
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  const user = await sessionUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const { id: assessmentId, artifactId } = await params
  const { assessment, error } = await getPracticalAssessment(assessmentId)
  if (error) return NextResponse.json({ error }, { status: 503 })
  if (!assessment || !assessment.is_published) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
  }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id')
    .eq('course_id', assessment.course_id)
    .eq('user_id', user.id)
    .eq('status', 'admitted')
    .maybeSingle()
  if (!enrollment) return NextResponse.json({ error: 'Not admitted' }, { status: 403 })

  const result = await getPracticalArtifactSignedUrl({
    artifactId,
    courseId: assessment.course_id,
    ownerUserId: user.id,
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  if (result.assessmentId !== assessmentId) {
    return NextResponse.json({ error: 'Artifact does not belong to this assessment' }, { status: 403 })
  }

  return NextResponse.redirect(result.url, 302)
}
