import { redirect } from 'next/navigation'

/** Legacy admin password login — use unified sign-in with Administrator role. */
export default async function LegacyAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const query = new URLSearchParams()
  query.set('role', 'admin')
  for (const [key, value] of Object.entries(params)) {
    if (key === 'role') continue
    if (typeof value === 'string') query.set(key, value)
    else if (Array.isArray(value) && value[0]) query.set(key, value[0])
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  redirect(`/auth/login${suffix}`)
}
