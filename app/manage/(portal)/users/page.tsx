import type { Metadata } from 'next'
import { requireShopPortalAdmin } from '@/lib/shop/portal-session'
import { ShopForbiddenPanel } from '@/components/shop-portal/shop-page-chrome'
import { ShopLocalizedPageHeader } from '@/components/shop-portal/shop-localized-page-header'
import { ShopStaffPanel } from '@/components/shop-portal/shop-staff-panel'

export const metadata: Metadata = {
  title: 'Staff Management | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopUsersPage() {
  const session = await requireShopPortalAdmin('/users')
  if (!session) {
    return (
      <div>
        <ShopLocalizedPageHeader
          titleKey="staff.title"
          descriptionKey="staff.descriptionForbidden"
        />
        <ShopForbiddenPanel />
      </div>
    )
  }

  return (
    <div>
      <ShopLocalizedPageHeader titleKey="staff.title" descriptionKey="staff.description" />
      <ShopStaffPanel currentUserId={session.user.id} />
    </div>
  )
}
