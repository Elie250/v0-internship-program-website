import { NextResponse } from 'next/server'
import {
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'
import { requireLecturerSession } from '@/lib/lecturer/access'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_PDF_BYTES = 20 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: Request) {
  try {
    const user = await requireLecturerSession()

    if (!storageConfigured()) {
      return NextResponse.json({ error: 'Storage not configured', hint: storageConfigHint() }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const kind = String(formData.get('kind') ?? 'cover')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (kind === 'pdf') {
      if (file.size > MAX_PDF_BYTES) {
        return NextResponse.json({ error: 'PDF must be under 20 MB' }, { status: 400 })
      }
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json({ error: 'Upload a PDF file' }, { status: 400 })
      }
    } else {
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image must be under 8 MB' }, { status: 400 })
      }
      if (!IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Upload a JPG, PNG, WebP, or GIF image' }, { status: 400 })
      }
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || (kind === 'pdf' ? 'pdf' : 'jpg')
    const folder = kind === 'pdf' ? 'energy-library-docs' : 'energy-library'
    const path = `${folder}/lecturers/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = kind === 'pdf' ? 'application/pdf' : file.type

    const result = await uploadObject(path, buffer, contentType)
    return NextResponse.json({ url: result.url, path: result.path, kind })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status = message === 'Unauthorized' || message.includes('Lecturer') ? 403 : 500
    return NextResponse.json({ error: message, hint: storageConfigHint() }, { status })
  }
}
