import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'
import { validateCourseMaterialFile } from '@/lib/storage/course-material-upload'

export async function POST(request: Request) {
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

  const formData = await request.formData()
  const file = formData.get('file')
  const courseId = String(formData.get('courseId') ?? '')

  if (!(file instanceof File) || !courseId) {
    return NextResponse.json({ error: 'file and courseId required' }, { status: 400 })
  }

  const { data: enrollment } = await supabaseAdmin
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .eq('status', 'admitted')
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Not admitted' }, { status: 403 })

  const validation = validateCourseMaterialFile(file)
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `lab-submissions/${courseId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await uploadObject(path, buffer, validation.contentType)
    return NextResponse.json({ url: result.url, fileName: file.name })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message, hint: storageConfigHint() }, { status: 500 })
  }
}
