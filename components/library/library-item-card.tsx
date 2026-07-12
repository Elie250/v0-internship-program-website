import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Images, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  libraryItemCover,
  pillarLabel,
  type EnergyLibraryItem,
  type LibraryPillar,
} from '@/lib/library/items'

const pillarIcons: Record<LibraryPillar, typeof Images> = {
  gallery: Images,
  books: BookOpen,
  culture: Sparkles,
}

export function LibraryItemCard({ item }: { item: EnergyLibraryItem }) {
  const cover = libraryItemCover(item)
  const Icon = pillarIcons[item.pillar]

  return (
    <Link href={`/library/${item.slug}`} className="group block no-underline hover:no-underline">
      <Card className="h-full overflow-hidden border-slate-200 transition-shadow group-hover:shadow-md">
        <div className="relative aspect-[4/3] bg-slate-100">
          {cover ? (
            <Image src={cover} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Icon className="h-10 w-10" />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-700">
            {pillarLabel(item.pillar)}
          </span>
        </div>
        <CardContent className="p-4 space-y-1">
          <h3 className="font-semibold text-slate-900 group-hover:text-[var(--brand-navy)] line-clamp-2">
            {item.title}
          </h3>
          {item.description ? (
            <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
          ) : null}
          {item.author_name ? (
            <p className="text-xs text-slate-500">By {item.author_name}</p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}
