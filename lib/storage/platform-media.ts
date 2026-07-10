import { deleteObjectByUrl, parseObjectPath } from '@/lib/storage/object-storage'

/** @deprecated Use parseObjectPath from object-storage */
export function parsePlatformMediaPath(publicUrl: string): string | null {
  return parseObjectPath(publicUrl)
}

export async function deletePlatformMediaFile(publicUrl: string): Promise<void> {
  await deleteObjectByUrl(publicUrl)
}
