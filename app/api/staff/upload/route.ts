import { NextResponse } from 'next/server'
import { requireStaffPermission } from '@/lib/staff/context'
import { assertStaffMutationAllowed } from '@/lib/staff/request-auth'
import { STAFF_API_PERMISSIONS } from '@/lib/shop/staff-api/permissions'
import {
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'

export async function POST(request: Request) {
  try {
    const csrf = assertStaffMutationAllowed(request)
    if (!csrf.ok) {
      return NextResponse.json({ error: csrf.error }, { status: 403 })
    }

    const auth = await requireStaffPermission(request, STAFF_API_PERMISSIONS.productManage)
    if ('response' in auth) return auth.response

    if (!storageConfigured()) {
      return NextResponse.json({ error: 'Storage not configured', hint: storageConfigHint() }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const folder = String(formData.get('folder') ?? 'products')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (folder !== 'products') {
      return NextResponse.json({ error: 'Staff can only upload product images' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadObject(path, buffer, file.type)

    return NextResponse.json({ url: result.url, path: result.path, provider: result.provider })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message, hint: storageConfigHint() }, { status })
  }
}
