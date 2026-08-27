'use client'

import { Button } from '@/components/ui/button'
import { formatShopInteger } from '@/lib/shop/format'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

export function ShopListPagination({
  page,
  limit,
  total,
  onPageChange,
  disabled,
}: {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  disabled?: boolean
}) {
  const t = useShopT()
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(total, page * limit)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-xs text-slate-500">
        {total === 0
          ? t('pagination.none')
          : t('pagination.showing', {
              from: formatShopInteger(from),
              to: formatShopInteger(to),
              total: formatShopInteger(total),
            })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('action.previous')}
        </Button>
        <span className="text-xs tabular-nums text-slate-600">
          {t('pagination.page', {
            page: formatShopInteger(page),
            totalPages: formatShopInteger(totalPages),
          })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('action.next')}
        </Button>
      </div>
    </div>
  )
}
