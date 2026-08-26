import Link from 'next/link'
import type { StaffDashboardReport } from '@/lib/shop/staff-api/dashboard'
import { formatShopInteger, formatShopRwf } from '@/lib/shop/format'
import { SHOP_PORTAL_DISPLAY } from '@/lib/shop/portal-nav'

type Metric = {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'warn' | 'muted'
}

function MetricTile({ label, value, hint, tone = 'default' }: Metric) {
  const valueClass =
    tone === 'warn'
      ? 'text-amber-800'
      : tone === 'muted'
        ? 'text-slate-500'
        : 'text-[var(--brand-navy,#1e3a5f)]'

  return (
    <div className="shop-dash-metric rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${valueClass}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500 leading-snug">{hint}</p> : null}
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function ShopDashboardView({
  report,
  showSales,
  showStock,
  canOpenPos,
  canOpenSales,
  canOpenInventory,
  loadError,
}: {
  report: StaffDashboardReport | null
  showSales: boolean
  showStock: boolean
  canOpenPos: boolean
  canOpenSales: boolean
  canOpenInventory: boolean
  loadError: string | null
}) {
  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
        <p className="text-sm font-medium text-red-950">Dashboard unavailable</p>
        <p className="mt-1 text-sm text-red-900/80">{loadError}</p>
      </div>
    )
  }

  if (!showSales && !showStock) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
        <p className="text-sm text-slate-700 leading-relaxed">
          You are signed in to {SHOP_PORTAL_DISPLAY.brandName}, but your role does not include sales
          or inventory reporting permissions. Ask an administrator if you need operational metrics.
        </p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
        <p className="text-sm text-slate-600">No dashboard data is available yet.</p>
      </div>
    )
  }

  const salesMetrics: Metric[] = [
    {
      label: "Today's sales",
      value: formatShopRwf(report.todaySales),
      hint: 'Paid / approved orders only',
    },
    {
      label: "Today's orders",
      value: formatShopInteger(report.todayOrders),
      hint: `${formatShopInteger(report.todayPosOrders)} POS · ${formatShopInteger(report.todayOnlineOrders)} online`,
    },
    {
      label: 'Pending payment',
      value: formatShopInteger(report.pendingOrders),
      hint: 'Unpaid, review, or gateway pending',
      tone: report.pendingOrders > 0 ? 'warn' : 'default',
    },
  ]

  const stockMetrics: Metric[] = [
    {
      label: 'Catalog items',
      value: formatShopInteger(report.catalogItems),
      hint: 'Published and draft products',
    },
    {
      label: 'In stock',
      value: formatShopInteger(report.inStockItems),
    },
    {
      label: 'Low stock',
      value: formatShopInteger(report.lowStockItems),
      tone: report.lowStockItems > 0 ? 'warn' : 'default',
      hint: 'At or below threshold, still available',
    },
    {
      label: 'Out of stock',
      value: formatShopInteger(report.outOfStockItems),
      tone: report.outOfStockItems > 0 ? 'warn' : 'default',
    },
  ]

  const shortcuts = [
    canOpenPos ? { href: '/pos', label: 'Open POS' } : null,
    canOpenSales ? { href: '/sales', label: 'Sales history' } : null,
    canOpenInventory ? { href: '/inventory', label: 'Inventory' } : null,
  ].filter(Boolean) as { href: string; label: string }[]

  return (
    <div className="shop-dashboard space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-slate-600">
          Business day{' '}
          <span className="font-medium text-slate-900">{report.businessDate}</span>
          <span className="text-slate-400"> · </span>
          <span className="tabular-nums">{report.timezone}</span>
        </p>
        <p className="text-xs text-slate-500">
          Stock model: global catalog quantity (not per location)
        </p>
      </div>

      {showSales ? (
        <Section
          title="Sales today"
          description="Figures are computed on the server from live orders. Profit is not shown until an audited cost report is available."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {salesMetrics.map((m) => (
              <MetricTile key={m.label} {...m} />
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Profit reporting is not enabled yet — no estimated or fabricated margin is shown.
          </p>
        </Section>
      ) : null}

      {showStock ? (
        <Section
          title="Inventory snapshot"
          description="Quantities come from products.stock — the authoritative global inventory field."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stockMetrics.map((m) => (
              <MetricTile key={m.label} {...m} />
            ))}
          </div>
        </Section>
      ) : null}

      {shortcuts.length > 0 ? (
        <Section title="Shortcuts">
          <div className="flex flex-wrap gap-2">
            {shortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[var(--brand-navy,#1e3a5f)] shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      <style>{`
        .shop-dash-metric {
          animation: shop-dash-in 420ms ease-out both;
        }
        .shop-dash-metric:nth-child(2) { animation-delay: 60ms; }
        .shop-dash-metric:nth-child(3) { animation-delay: 120ms; }
        .shop-dash-metric:nth-child(4) { animation-delay: 180ms; }
        @keyframes shop-dash-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .shop-dash-metric { animation: none; }
        }
      `}</style>
    </div>
  )
}
