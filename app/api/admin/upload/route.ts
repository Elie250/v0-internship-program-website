import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS, type Permission } from '@/lib/admin/permissions'
import {
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'

const ALLOWED_FOLDERS = ['products', 'services', 'announcements', 'courses', 'brand', 'hero', 'engineering', 'engineering-docs'] as const

const FOLDER_PERMISSIONS: Record<(typeof ALLOWED_FOLDERS)[number], Permission> = {
  brand: PERMISSIONS.SETTINGS_MANAGE,
  hero: PERMISSIONS.SETTINGS_MANAGE,
  products: PERMISSIONS.SHOP_PRODUCTS,
  services: PERMISSIONS.CONTENT_SERVICES,
  announcements: PERMISSIONS.CONTENT_ANNOUNCEMENTS,
  engineering: PERMISSIONS.CONTENT_ANNOUNCEMENTS,
  'engineering-docs': PERMISSIONS.CONTENT_ANNOUNCEMENTS,
  courses: PERMISSIONS.LEARNING_PROGRAMS,
}

export async function POST(request: Request) {
  try {
    if (!storageConfigured()) {
      return NextResponse.json({ error: 'Storage not configured', hint: storageConfigHint() }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const folder = String(formData.get('folder') ?? 'products')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_FOLDERS.includes(folder as (typeof ALLOWED_FOLDERS)[number])) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
    }

    await requireAdminPermission(FOLDER_PERMISSIONS[folder as (typeof ALLOWED_FOLDERS)[number]])

    const isPdfDoc = folder === 'engineering-docs'
    if (isPdfDoc) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
      }
    } else if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be an image or video' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || (isPdfDoc ? 'pdf' : 'jpg')
    const fixedName = String(formData.get('filename') ?? '').trim()
    const path =
      folder === 'hero' && fixedName && /^[\w.-]+$/.test(fixedName)
        ? `hero/${fixedName}`
        : `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await uploadObject(path, buffer, isPdfDoc ? 'application/pdf' : file.type, {
      upsert: folder === 'hero' && Boolean(fixedName),
    })

    return NextResponse.json({ url: result.url, path: result.path, provider: result.provider })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message, hint: storageConfigHint() }, { status })
  }
}
