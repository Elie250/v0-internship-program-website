import { redirect } from 'next/navigation'

export default async function EmployerContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const params = await searchParams
  const requested = params.redirect
  const safe =
    requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/employer'
  redirect(`/jobs/auth/continue?redirect=${encodeURIComponent(safe)}`)
}
