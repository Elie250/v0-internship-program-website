import { SiteHeader } from '@/components/layout/site-header'
import { ShopCartProvider } from '@/lib/shop/cart-context'
import { ShopCartPanel } from '@/components/shop/shop-cart-panel'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopCartProvider>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="border-b bg-[#1e3a5f]/5">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Add items to your cart, then submit an order with your contact details for delivery or pickup.
            </p>
            <ShopCartPanel />
          </div>
        </div>
        {children}
      </div>
    </ShopCartProvider>
  )
}
