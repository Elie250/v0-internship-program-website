const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'])
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

export function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

export function parseYouTubeVideoId(
  value: string
): { ok: true; videoId: string; href: string } | { ok: false; error: string } {
  const trimmed = value.trim()
  if (!trimmed) return { ok: false, error: 'A YouTube URL is required' }
  if (trimmed.startsWith('<') || /<iframe/i.test(trimmed)) {
    return { ok: false, error: 'Paste a YouTube link, not embed HTML' }
  }
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return { ok: false, error: 'Relative URLs are not allowed' }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: 'Enter a valid https:// YouTube URL' }
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'YouTube URL must start with https://' }
  }

  const host = parsed.hostname.toLowerCase()
  if (!YOUTUBE_HOSTS.has(host)) {
    return { ok: false, error: 'Only youtube.com and youtu.be links are supported' }
  }

  const path = parsed.pathname.toLowerCase()
  if (path.includes('/redirect') || parsed.searchParams.has('q') && path.endsWith('/redirect')) {
    return { ok: false, error: 'YouTube redirect links are not allowed' }
  }
  if (path.includes('live_chat') || path.includes('/live_chat')) {
    return { ok: false, error: 'YouTube live chat links are not allowed' }
  }
  if (path === '/playlist' || path.startsWith('/playlist/')) {
    return { ok: false, error: 'YouTube playlist links are not supported' }
  }

  let videoId = ''
  if (host === 'youtu.be') {
    videoId = parsed.pathname.split('/').filter(Boolean)[0] || ''
  } else if (parsed.searchParams.get('v')) {
    videoId = parsed.searchParams.get('v') || ''
  } else {
    const shorts = parsed.pathname.match(/^\/shorts\/([^/]+)/i)
    const embed = parsed.pathname.match(/^\/embed\/([^/]+)/i)
    videoId = shorts?.[1] || embed?.[1] || ''
  }

  videoId = videoId.trim()
  if (!videoId) {
    return { ok: false, error: 'Could not find a YouTube video ID in that link' }
  }
  if (!YOUTUBE_VIDEO_ID.test(videoId)) {
    return { ok: false, error: 'That YouTube video ID is not valid' }
  }

  return { ok: true, videoId, href: parsed.href }
}

export function youtubePrivacyEmbedUrl(videoId: string): string | null {
  const id = videoId.trim()
  if (!YOUTUBE_VIDEO_ID.test(id)) return null
  return `https://www.youtube-nocookie.com/embed/${id}`
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
    const youtube = parseYouTubeVideoId(trimmed)
    if (youtube.ok) {
      return youtubePrivacyEmbedUrl(youtube.videoId)
    }

    const parsed = new URL(trimmed)

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
