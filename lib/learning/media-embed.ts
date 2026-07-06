export function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

export function isYouTubeOrVimeo(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.toLowerCase()
    return host.includes('youtube.com') || host === 'youtu.be' || host.includes('vimeo.com')
  } catch {
    return false
  }
}

/** Prefer native <video> for course uploads; use iframe only for YouTube/Vimeo links. */
export function useNativeVideoPlayer(url: string, contentType?: string): boolean {
  if (contentType === 'video') {
    return !isYouTubeOrVimeo(url)
  }
  return isDirectVideoFile(url)
}

export function embedMediaUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  if (isDirectVideoFile(trimmed)) return trimmed

  try {
    const parsed = new URL(trimmed)

    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`
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
    return trimmed
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
