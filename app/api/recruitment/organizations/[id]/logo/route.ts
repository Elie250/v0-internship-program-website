import { NextResponse } from 'next/server'
import { requireOrganizationAccess } from '@/lib/recruitment/authz'
import { updateOrganization } from '@/lib/recruitment/organizations'
import {
  storageConfigHint,
  storageConfigured,
  uploadObject,
} from '@/lib/storage/object-storage'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params
    const access = await requireOrganizationAccess(organizationId, ['organization_admin'])
    if (!access.asPlatformAdmin && access.membership?.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!storageConfigured()) {
      return NextResponse.json(
        { error: 'Storage not configured', hint: storageConfigHint() },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Logo must be a PNG, JPEG, WebP, or GIF image' },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Logo must be 2 MB or smaller' }, { status: 400 })
    }

    const ext =
      file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
          ? 'webp'
          : file.type === 'image/gif'
            ? 'gif'
            : 'jpg'
    const path = `recruitment-orgs/${organizationId}/logo-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploaded = await uploadObject(path, buffer, file.type)

    const result = await updateOrganization({
      id: organizationId,
      logoUrl: uploaded.url,
      actorUserId: access.user.id,
    })
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      url: uploaded.url,
      path: uploaded.path,
      organization: result.organization,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message, hint: storageConfigHint() }, { status })
  }
}
