'use client'

import Link from 'next/link'
import type { StaffDashboardReport } from '@/lib/shop/staff-api/dashboard'
import { formatShopInteger, formatShopRwf } from '@/lib/shop/format'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

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
  const t = useShopT()

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
        <p className="text-sm font-medium text-red-950">{t('dashboard.unavailable')}</p>
        <p className="mt-1 text-sm text-red-900/80">{loadError}</p>
      </div>
    )
  }

  if (!showSales && !showStock) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
        <p className="text-sm text-slate-700 leading-relaxed">
          {t('dashboard.noPerms', { brandName: t('brand.name') })}
        </p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
        <p className="text-sm text-slate-600">{t('dashboard.noData')}</p>
      </div>
    )
  }

  const salesMetrics: Metric[] = [
    {
      label: t('dashboard.metric.todaySales'),
      value: formatShopRwf(report.todaySales),
      hint: t('dashboard.metric.todaySalesHint'),
    },
    {
      label: t('dashboard.metric.todayOrders'),
      value: formatShopInteger(report.todayOrders),
      hint: t('dashboard.metric.todayOrdersHint', {
        pos: formatShopInteger(report.todayPosOrders),
        online: formatShopInteger(report.todayOnlineOrders),
      }),
    },
    {
      label: t('dashboard.metric.pending'),
      value: formatShopInteger(report.pendingOrders),
      hint: t('dashboard.metric.pendingHint'),
      tone: report.pendingOrders > 0 ? 'warn' : 'default',
    },
  ]

  const stockMetrics: Metric[] = [
    {
      label: t('dashboard.metric.catalog'),
      value: formatShopInteger(report.catalogItems),
      hint: t('dashboard.metric.catalogHint'),
    },
    {
      label: t('dashboard.metric.inStock'),
      value: formatShopInteger(report.inStockItems),
    },
    {
      label: t('dashboard.metric.lowStock'),
      value: formatShopInteger(report.lowStockItems),
      tone: report.lowStockItems > 0 ? 'warn' : 'default',
      hint: t('dashboard.metric.lowStockHint'),
    },
    {
      label: t('dashboard.metric.outOfStock'),
      value: formatShopInteger(report.outOfStockItems),
      tone: report.outOfStockItems > 0 ? 'warn' : 'default',
    },
  ]

  const shortcuts = [
    canOpenPos ? { href: '/pos', label: t('dashboard.shortcut.pos') } : null,
    canOpenSales ? { href: '/sales', label: t('dashboard.shortcut.sales') } : null,
    canOpenInventory ? { href: '/inventory', label: t('dashboard.shortcut.inventory') } : null,
  ].filter(Boolean) as { href: string; label: string }[]

  return (
    <div className="shop-dashboard space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-slate-600">
          {t('dashboard.businessDay')}{' '}
          <span className="font-medium text-slate-900">{report.businessDate}</span>
          <span className="text-slate-400"> · </span>
          <span className="tabular-nums">{report.timezone}</span>
        </p>
        <p className="text-xs text-slate-500">{t('dashboard.stockModelNote')}</p>
      </div>

      {showSales ? (
        <Section
          title={t('dashboard.section.salesToday')}
          description={t('dashboard.section.salesTodayDesc')}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {salesMetrics.map((m) => (
              <MetricTile key={m.label} {...m} />
            ))}
          </div>
          <p className="text-xs text-slate-500">{t('dashboard.profitNote')}</p>
        </Section>
      ) : null}

      {showStock ? (
        <Section
          title={t('dashboard.section.inventory')}
          description={t('dashboard.section.inventoryDesc')}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stockMetrics.map((m) => (
              <MetricTile key={m.label} {...m} />
            ))}
          </div>
        </Section>
      ) : null}

      {shortcuts.length > 0 ? (
        <Section title={t('dashboard.section.shortcuts')}>
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
