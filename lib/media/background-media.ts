const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i

/** True when a hero background URL should render as video instead of an image. */
export function isVideoBackgroundUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false
  const value = url.trim()
  return VIDEO_EXTENSIONS.test(value) || value.startsWith('/videos/')
}
