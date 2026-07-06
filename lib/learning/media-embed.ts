export function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

export function isSupabaseStorageMediaUrl(url: string): boolean {
  return /\/storage\/v1\/object\/(?:public|sign)\//i.test(url.trim())
}

export function isYouTubeOrVimeo(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.toLowerCase()
    return (
      host.includes('youtube.com') ||
      host === 'youtu.be' ||
      host.includes('vimeo.com')
    )
  } catch {
    return false
  }
}

/** Use inline <video> only for direct files or Supabase-hosted media. */
export function canPlayAsNativeVideo(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (isDirectVideoFile(trimmed)) return true
  if (isSupabaseStorageMediaUrl(trimmed)) return true
  return false
}

export function embedMediaUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  if (isDirectVideoFile(trimmed)) return trimmed

  try {
    const parsed = new URL(trimmed)

    if (parsed.hostname.includes('youtube.com')) {
      const watchId = parsed.searchParams.get('v')
      if (watchId) return `https://www.youtube.com/embed/${watchId}`

      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/]+)/)
      if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`
    }

    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace('/', '')
      if (id) return `https://www.youtube.com/embed/${id}`
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      if (id) return `https://player.vimeo.com/video/${id}`
    }
  } catch {
    return null
  }

  return null
}

export function isWebinarJoinUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return (
    lower.includes('zoom.us') ||
    lower.includes('meet.google.com') ||
    lower.includes('teams.microsoft.com') ||
    lower.includes('webex.com')
  )
}

export function isPdfUrl(url: string, contentType?: string): boolean {
  if (contentType === 'pdf') return true
  return /\.pdf(\?|$)/i.test(url)
}
