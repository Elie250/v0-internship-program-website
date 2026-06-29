import { supabaseAdmin } from '@/lib/supabaseAdmin'

const BUCKET = 'platform-media'

/** Extract storage object path from a Supabase public URL. */
export function parsePlatformMediaPath(publicUrl: string): string | null {
  if (!publicUrl?.trim()) return null

  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null

  const path = publicUrl.slice(idx + marker.length).split('?')[0]
  return path ? decodeURIComponent(path) : null
}

export async function deletePlatformMediaFile(publicUrl: string): Promise<void> {
  if (!supabaseAdmin) return

  const path = parsePlatformMediaPath(publicUrl)
  if (!path) return

  await supabaseAdmin.storage.from(BUCKET).remove([path])
}
