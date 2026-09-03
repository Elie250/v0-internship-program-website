import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getShopPortalSession,
  isCurrentRequestShopHost,
} from '@/lib/shop/portal-session'

export const metadata: Metadata = {
  title: 'Shop Management | Energy & Logics',
  robots: { index: false, follow: false },
}

/** Phase 1C.1 landing — now routes into auth flow (1C.3). */
export default async function ShopManageLandingPage() {
  const onShopHost = await isCurrentRequestShopHost()
  if (!onShopHost) {
    redirect('/')
  }

  const session = await getShopPortalSession()
  redirect(session ? '/dashboard' : '/login')
}
