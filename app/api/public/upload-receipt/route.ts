import { NextResponse } from 'next/server'
import {
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const EXT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
}

function receiptContentType(file: File): string | null {
  const declared = file.type?.toLowerCase()
  if (declared && ALLOWED_TYPES.includes(declared)) return declared
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return EXT_TYPES[ext] ?? null
}

export async function POST(request: Request) {
  try {
    if (!storageConfigured()) {
      return NextResponse.json({ error: 'Storage not configured', hint: storageConfigHint() }, { status: 500 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const contentType = receiptContentType(file)
    if (!contentType) {
      return NextResponse.json({ error: 'Upload a JPG, PNG, WebP, or PDF receipt' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || (contentType === 'application/pdf' ? 'pdf' : 'jpg')
    const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext === 'jpeg' ? 'jpg' : ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await uploadObject(path, buffer, contentType)
    return NextResponse.json({ url: result.url, path: result.path })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message, hint: storageConfigHint() }, { status: 500 })
  }
}
