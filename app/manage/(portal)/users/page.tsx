import type { Metadata } from 'next'
import { requireShopPortalAdmin } from '@/lib/shop/portal-session'
import {
  ShopForbiddenPanel,
  ShopPageHeader,
} from '@/components/shop-portal/shop-page-chrome'
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
        <ShopPageHeader
          title="Staff Management"
          description="Create and manage salesperson and inventory manager accounts."
        />
        <ShopForbiddenPanel />
      </div>
    )
  }

  return (
    <div>
      <ShopPageHeader
        title="Staff Management"
        description="Create salesperson and inventory manager accounts, reset passwords, and revoke Shop sessions. Administrators cannot be created here."
      />
      <ShopStaffPanel currentUserId={session.user.id} />
    </div>
  )
}
