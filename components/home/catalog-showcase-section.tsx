import { getPublishedCourses, getPublishedProducts } from '@/lib/platform/queries'
import { getBrainGamesForHub } from '@/app/actions/brain-training'
import { BRAIN_GAME_CATALOG } from '@/lib/brain-training/catalog'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import {
  CatalogShowcaseRotator,
  type ShowcaseColumn,
  type ShowcaseItem,
} from '@/components/home/catalog-showcase-rotator'
import { isFreeProgram } from '@/lib/enrollment/program-types'

/** Three live windows — courses, products, games — cycling every few seconds. */
export async function CatalogShowcaseSection() {
  const [courses, products, gameRows] = await Promise.all([
    getPublishedCourses().catch(() => []),
    getPublishedProducts().catch(() => []),
    getBrainGamesForHub().catch(() => []),
  ])

  const thumbBySlug = new Map(gameRows.map((r) => [r.slug, r.thumbnailUrl]))
  const activeSlugs = new Set(
    gameRows.length === 0
      ? BRAIN_GAME_CATALOG.map((g) => g.slug)
      : gameRows.filter((r) => r.isActive !== false).map((r) => r.slug)
  )

  const courseItems: ShowcaseItem[] = courses.slice(0, 24).map((course) => ({
    id: course.id,
    title: course.title,
    subtitle: isFreeProgram(course.pricing)
      ? 'Free programme'
      : `${Number(course.pricing ?? 0).toLocaleString()} RWF`,
    href: `/learning/${course.id}`,
    imageUrl: course.thumbnail || null,
  }))

  const productItems: ShowcaseItem[] = products.slice(0, 24).map((product) => ({
    id: product.id,
    title: product.name,
    subtitle:
      product.price != null ? `${Number(product.price).toLocaleString()} RWF` : 'In the shop',
    href: `/shop/${product.id}`,
    imageUrl: product.images?.[0] || null,
  }))

  const gameItems: ShowcaseItem[] = BRAIN_GAME_CATALOG.filter((g) => activeSlugs.has(g.slug)).map(
    (game) => ({
      id: game.slug,
      title: game.name,
      subtitle: game.shortTagline,
      href: `/tools/brain-training/${game.slug}`,
      imageUrl: thumbBySlug.get(game.slug) || null,
      artFrom: game.art.from,
      artTo: game.art.to,
    })
  )

  const columns: ShowcaseColumn[] = [
    {
      id: 'courses',
      label: 'Courses',
      browseHref: '/learning',
      browseLabel: 'All programmes',
      items: courseItems,
    },
    {
      id: 'products',
      label: 'Products',
      browseHref: '/shop',
      browseLabel: 'Browse shop',
      items: productItems,
    },
    {
      id: 'games',
      label: 'Games',
      browseHref: '/tools/brain-training',
      browseLabel: 'Open Arcade',
      items: gameItems,
    },
  ]

  if (columns.every((c) => c.items.length === 0)) return null

  return (
    <section
      id="showcase"
      className="home-section home-section--compact home-section--white border-b border-slate-200"
    >
      <div className="max-w-6xl mx-auto">
        <HomeSectionHeader
          eyebrow="Discover"
          title="What we have for you"
          description="Courses, shop gear, and Brain Training drills — each window keeps rotating so you can skim everything we offer."
        />
        <CatalogShowcaseRotator columns={columns} />
      </div>
    </section>
  )
}
