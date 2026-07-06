import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import {
  isStorageMimeTypeError,
  validateCourseMaterialFile,
} from '@/lib/storage/course-material-upload'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const validation = validateCourseMaterialFile(file)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const path = `course-materials/${courseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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
            ? 'Run scripts/25-platform-media-course-materials.sql in Supabase to allow PDFs and lesson files.'
            : 'Ensure the platform-media bucket exists, or paste a public URL instead.',
        },
        { status: 500 }
      )
    }

    const { data } = supabaseAdmin.storage.from('platform-media').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl, path })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status =
      message === 'Unauthorized' || message.includes('not assigned') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
