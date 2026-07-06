import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  isStorageMimeTypeError,
  validateCourseMaterialFile,
} from '@/lib/storage/course-material-upload'

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

  const { error: uploadError } = await supabaseAdmin.storage
    .from('platform-media')
    .upload(path, buffer, { contentType: validation.contentType, upsert: false })

  if (uploadError) {
    const mimeBlocked = isStorageMimeTypeError(uploadError.message)
    return NextResponse.json(
      {
        error: uploadError.message,
        hint: mimeBlocked
          ? 'Run scripts/25-platform-media-course-materials.sql in Supabase.'
          : undefined,
      },
      { status: 500 }
    )
  }

  const { data } = supabaseAdmin.storage.from('platform-media').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl, fileName: file.name })
}
