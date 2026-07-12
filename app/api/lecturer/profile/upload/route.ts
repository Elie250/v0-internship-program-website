import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'

const TEAM_ROLES = new Set(['lecturer', 'instructor', 'support_staff'])
const MAX_BYTES = 8 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const CV_TYPES = ['application/pdf']

export async function POST(request: Request) {
  const raw = (await cookies()).get('user_session')?.value
  if (!raw) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let userId: string
  let role: string
  try {
    const session = JSON.parse(raw) as { id: string; role?: string }
    userId = session.id
    role = session.role ?? ''
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!TEAM_ROLES.has(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!storageConfigured()) {
    return NextResponse.json({ error: 'Storage not configured', hint: storageConfigHint() }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const kind = String(formData.get('kind') ?? 'photo')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 8 MB' }, { status: 400 })
  }

  if (kind === 'cv') {
    if (!CV_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Upload a PDF CV' }, { status: 400 })
    }
  } else if (!PHOTO_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Upload a JPG, PNG, WebP, or GIF image' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || (kind === 'cv' ? 'pdf' : 'jpg')
  const folder = kind === 'cv' ? 'cv' : 'profile'
  const path = `lecturers/${userId}/${folder}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType = kind === 'cv' ? 'application/pdf' : file.type

  try {
    const result = await uploadObject(path, buffer, contentType)
    return NextResponse.json({ url: result.url, path: result.path, kind })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message, hint: storageConfigHint() }, { status: 500 })
  }
}
