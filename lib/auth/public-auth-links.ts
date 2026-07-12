export function buildAuthLinks(returnPath: string): {
  loginUrl: string
  registerUrl: string
} {
  const safePath =
    returnPath.startsWith('/') && !returnPath.startsWith('//') ? returnPath : '/engineering'
  const redirect = encodeURIComponent(safePath)
  return {
    loginUrl: `/auth/login?redirect=${redirect}`,
    registerUrl: `/auth/register?redirect=${redirect}`,
  }
}

export function authLinksFromReferer(request: Request, fallbackPath = '/engineering'): {
  loginUrl: string
  registerUrl: string
} {
  const referer = request.headers.get('referer')
  if (!referer) return buildAuthLinks(fallbackPath)
  try {
    const url = new URL(referer)
    return buildAuthLinks(url.pathname + url.search)
  } catch {
    return buildAuthLinks(fallbackPath)
  }
}
