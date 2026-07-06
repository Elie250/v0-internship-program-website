'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StarRatingDisplay({
  rating,
  size = 'md',
  className,
}: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'

  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-slate-200 text-slate-200'
          )}
        />
      ))}
    </div>
  )
}

export function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (rating: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Select rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] disabled:opacity-50"
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              'h-8 w-8 transition-colors',
              star <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-300 hover:text-amber-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}
