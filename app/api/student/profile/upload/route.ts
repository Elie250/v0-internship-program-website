import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: Request) {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let userId: string
  try {
    userId = JSON.parse(raw).id
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!storageConfigured()) {
    return NextResponse.json({ error: 'Storage not configured', hint: storageConfigHint() }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Upload a JPG, PNG, WebP, or GIF image' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `students/${userId}/profile-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await uploadObject(path, buffer, file.type)
    return NextResponse.json({ url: result.url, path: result.path })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message, hint: storageConfigHint() }, { status: 500 })
  }
}
