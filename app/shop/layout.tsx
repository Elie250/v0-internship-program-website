import { SiteHeader } from '@/components/layout/site-header'
import { ShopCartProvider } from '@/lib/shop/cart-context'
import { ShopCartPanel } from '@/components/shop/shop-cart-panel'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopCartProvider>
      <div className="min-h-screen bg-background shop-portal">
        <SiteHeader />
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-700 font-medium">
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
