import { redirect } from 'next/navigation'
import {
  isCurrentRequestShopHost,
  requireShopPortalSession,
} from '@/lib/shop/portal-session'
import { filterShopNavItems, roleDisplayLabel } from '@/lib/shop/portal-nav'
import { ShopShell } from '@/components/shop-portal/shop-shell'

export default async function ShopPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const onShopHost = await isCurrentRequestShopHost()
  if (!onShopHost) {
    redirect('/')
  }

  const session = await requireShopPortalSession('/dashboard')
  const items = filterShopNavItems(session.user.permissions, session.user.role)
  const userLabel =
    [session.user.firstName, session.user.lastName].filter(Boolean).join(' ').trim() ||
    session.user.email

  return (
    <ShopShell
      items={items}
      userLabel={userLabel}
      roleLabel={roleDisplayLabel(session.user.role)}
    >
      {children}
    </ShopShell>
  )
}
