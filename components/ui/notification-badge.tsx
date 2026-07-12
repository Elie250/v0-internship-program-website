import { cn } from '@/lib/utils'

export function NotificationBadge({
  count,
  className,
  size = 'md',
}: {
  count: number
  className?: string
  size?: 'sm' | 'md'
}) {
  if (count <= 0) return null

  const display = count > 99 ? '99+' : String(count)

  return (
    <span
      className={cn(
        'notification-badge inline-flex items-center justify-center rounded-full bg-red-600 font-bold text-white shadow-sm ring-2 ring-white',
        size === 'sm' ? 'min-h-5 min-w-5 px-1 text-[10px]' : 'min-h-6 min-w-6 px-1.5 text-xs',
        className
      )}
      aria-label={`${count} notifications`}
      title={`${count} item${count === 1 ? '' : 's'} need attention`}
    >
      {display}
    </span>
  )
}
