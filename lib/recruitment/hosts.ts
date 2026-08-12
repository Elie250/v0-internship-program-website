/**
 * Hosts that serve the Energy & Logics Talent / recruitment experience.
 * jobs.energyandlogics.com is configured on Vercel as an additional domain.
 */
const DEFAULT_RECRUITMENT_HOSTS = ['jobs.energyandlogics.com', 'jobs.localhost']

export function getRecruitmentHosts(): string[] {
  const extra = process.env.RECRUITMENT_HOSTS?.trim()
  const fromEnv = extra
    ? extra
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
    : []
  return [...new Set([...DEFAULT_RECRUITMENT_HOSTS, ...fromEnv])]
}

export function normalizeHostname(hostHeader: string | null): string {
  return (hostHeader ?? '').split(':')[0].trim().toLowerCase()
}

/** True when the request is on the dedicated Talent subdomain. */
export function isRecruitmentHost(hostHeader: string | null): boolean {
  const host = normalizeHostname(hostHeader)
  if (!host) return false
  if (getRecruitmentHosts().includes(host)) return true
  // Vercel preview deployments: jobs-*.vercel.app or *.vercel.app with jobs. prefix
  if (host.startsWith('jobs.') && host.endsWith('.vercel.app')) return true
  return false
}

/** Main Academy / marketing site — used for cross-host redirects only. */
export function getMainSiteOrigin(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'https://www.energyandlogics.com'
  return url.replace(/\/$/, '')
}

/** Prefixes that belong on the main site, not the Talent subdomain. */
export const ACADEMY_PATH_PREFIXES = [
  '/student',
  '/lecturer',
  '/engineer',
  '/learning',
  '/admin',
  '/dashboard',
  '/auth',
  '/shop',
  '/tools',
] as const

export function isAcademyPath(pathname: string): boolean {
  return ACADEMY_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isRecruitmentPath(pathname: string): boolean {
  return (
    pathname === '/jobs' ||
    pathname.startsWith('/jobs/') ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/employer') ||
    pathname.startsWith('/o/')
  )
}
