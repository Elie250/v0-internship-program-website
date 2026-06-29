import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { EngineeringSupportClient } from '@/components/support/engineering-support-client'
import { getSupportCategories } from '@/lib/platform/queries'
import { queryPublishedSupportPlans } from '@/lib/admin/data/support-plans'
import { getUserSupportAccess } from '@/lib/support/subscription-access'
import { getCurrentUser } from '@/app/actions/auth-service'

export default async function EngineeringSupportPage() {
  const [categories, plansRes, user] = await Promise.all([
    getSupportCategories(),
    queryPublishedSupportPlans(),
    getCurrentUser(),
  ])

  const access = user?.id ? await getUserSupportAccess(user.id) : null

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="text-on-dark bg-[var(--brand-navy)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Engineering Support Portal</h1>
          <p className="text-white/80 max-w-2xl">
            Individuals and engineers submit technical help requests with an active support subscription.
            Plans include ticket limits, response SLAs, and MoMo receipt verification by our admin team.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <EngineeringSupportClient
          categories={categories}
          plans={plansRes.plans}
          initialAccess={access}
          isLoggedIn={Boolean(user?.id)}
        />
      </section>
      <SiteFooter />
    </main>
  )
}
