import { cn } from '@/lib/utils'

type HomeSectionHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  align?: 'center' | 'left'
  className?: string
}

export function HomeSectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: HomeSectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-10 max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left max-w-3xl',
        className
      )}
    >
      <p className="section-eyebrow mb-2">{eyebrow}</p>
      <h2 className="section-title mb-3">{title}</h2>
      {description ? <p className="text-slate-600 text-sm sm:text-base">{description}</p> : null}
    </div>
  )
}
