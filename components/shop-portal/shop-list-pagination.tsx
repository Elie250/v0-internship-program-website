'use client'

import { Button } from '@/components/ui/button'
import { formatShopInteger } from '@/lib/shop/format'

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
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(total, page * limit)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-xs text-slate-500">
        {total === 0
          ? 'No results'
          : `Showing ${formatShopInteger(from)}–${formatShopInteger(to)} of ${formatShopInteger(total)}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-xs tabular-nums text-slate-600">
          Page {formatShopInteger(page)} / {formatShopInteger(totalPages)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
