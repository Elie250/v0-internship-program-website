import { Suspense } from 'react'
import { getCurrentUser } from '@/app/actions/auth-service'
import { redirect } from 'next/navigation'
import { getUserSupportAccess } from '@/lib/support/subscription-access'
import { loadPublishedArticles } from '@/lib/engineering/queries'
import { SubscriberHub } from '@/components/subscriber/subscriber-hub'

export const dynamic = 'force-dynamic'

export default async function SubscriberPage() {
  const user = await getCurrentUser()
  if (!user?.id) {
    redirect('/auth/login?redirect=/subscriber')
  }

  const access = await getUserSupportAccess(user.id)
  const articles = await loadPublishedArticles({ limit: 12 })

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SubscriberHub initialAccess={access} articles={articles} />
    </Suspense>
  )
}
