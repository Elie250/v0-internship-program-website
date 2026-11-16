import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'
import { getPracticalAssessment } from '@/lib/learning/practical-assessment-service'
import { validatePracticalUploadFile } from '@/lib/learning/practical-upload'
import { studentMayEditPractical } from '@/lib/learning/practical-assessments'
import { getStudentPracticalSubmission } from '@/lib/learning/practical-assessment-service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let userId: string
  try {
    userId = JSON.parse(raw).id
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  if (!storageConfigured()) {
    return NextResponse.json({ error: 'Storage not configured', hint: storageConfigHint() }, { status: 500 })
  }

  const { id: assessmentId } = await params
  const { assessment, error } = await getPracticalAssessment(assessmentId)
  if (error) return NextResponse.json({ error }, { status: 503 })
  if (!assessment || !assessment.is_published) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
  }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id')
    .eq('course_id', assessment.course_id)
    .eq('user_id', userId)
    .eq('status', 'admitted')
    .maybeSingle()
  if (!enrollment) return NextResponse.json({ error: 'Not admitted' }, { status: 403 })

  const existing = await getStudentPracticalSubmission({
    assessmentId,
    enrollmentId: enrollment.id,
  })
  if (existing.error) return NextResponse.json({ error: existing.error }, { status: 500 })
  if (existing.submission && !studentMayEditPractical(existing.submission.practical_status)) {
    return NextResponse.json({ error: 'This submission can no longer accept uploads' }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file required' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const validation = validatePracticalUploadFile({
    name: file.name,
    type: file.type,
    size: file.size,
    bytes: buffer,
  })
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

  const path = `assessment-submissions/${assessment.course_id}/${assessmentId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${validation.extension}`

  try {
    await uploadObject(path, buffer, validation.contentType)
    // Do not return a public CDN URL for private student work.
    return NextResponse.json({
      storageKey: path,
      fileName: file.name,
      contentType: validation.contentType,
      byteSize: file.size,
    })
  } catch (uploadError) {
    const message = uploadError instanceof Error ? uploadError.message : 'Upload failed'
    return NextResponse.json({ error: message, hint: storageConfigHint() }, { status: 500 })
  }
}
