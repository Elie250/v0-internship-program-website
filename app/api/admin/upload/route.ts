import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS, type Permission } from '@/lib/admin/permissions'

const ALLOWED_FOLDERS = ['products', 'services', 'announcements', 'courses', 'brand', 'hero'] as const

const FOLDER_PERMISSIONS: Record<(typeof ALLOWED_FOLDERS)[number], Permission> = {
  brand: PERMISSIONS.SETTINGS_MANAGE,
  hero: PERMISSIONS.SETTINGS_MANAGE,
  products: PERMISSIONS.SHOP_PRODUCTS,
  services: PERMISSIONS.CONTENT_SERVICES,
  announcements: PERMISSIONS.CONTENT_ANNOUNCEMENTS,
  courses: PERMISSIONS.LEARNING_PROGRAMS,
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
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

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be an image or video' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fixedName = String(formData.get('filename') ?? '').trim()
    const path =
      folder === 'hero' && fixedName && /^[\w.-]+$/.test(fixedName)
        ? `hero/${fixedName}`
        : `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from('platform-media')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: folder === 'hero' && Boolean(fixedName),
      })

    if (uploadError) {
      return NextResponse.json(
        {
          error: uploadError.message,
          hint: 'Create a public Supabase Storage bucket named "platform-media" (or paste an image URL instead).',
        },
        { status: 500 }
      )
    }

    const { data } = supabaseAdmin.storage.from('platform-media').getPublicUrl(path)

    return NextResponse.json({ url: data.publicUrl, path })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
