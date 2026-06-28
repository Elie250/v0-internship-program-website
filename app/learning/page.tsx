import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCategories, getPublishedCourses } from '@/lib/platform/queries'

export default async function LearningPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; category?: string }>
}) {
  const params = await searchParams
  const module = params.module ?? 'training'
  const categories = await getCategories('learning')
  const courses = await getPublishedCourses(params.category)

  const moduleTitles: Record<string, string> = {
    training: 'Training Programs',
    internship: 'Internship Learning Path',
    support: 'Engineering Support Learning',
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-[#1e3a5f] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Learning Portal</h1>
          <p className="text-white/80">Dynamic engineering education — categories and courses managed by administrators.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/learning?module=training"><Button variant={module === 'training' ? 'default' : 'outline'}>Training</Button></Link>
          <Link href="/internship"><Button variant="outline">Internship</Button></Link>
          <Link href="/engineering-support"><Button variant="outline">Engineering Support</Button></Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/learning"><Button size="sm" variant={!params.category ? 'secondary' : 'outline'}>All Categories</Button></Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/learning?module=${module}&category=${cat.slug}`}>
              <Button size="sm" variant={params.category === cat.slug ? 'secondary' : 'outline'}>{cat.name}</Button>
            </Link>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">{moduleTitles[module] ?? 'Courses'}</h2>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No published courses yet. Administrators can create courses and categories from the Admin Portal.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                {course.thumbnail && (
                  <div className="relative h-44">
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                  </div>
                )}
                <CardHeader>
                  <p className="text-xs text-muted-foreground">{course.category?.name ?? 'Uncategorized'}</p>
                  <CardTitle>{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{course.description}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mb-4">
                    <span>{course.difficulty ?? 'All levels'}</span>
                    <span>{course.duration ?? 'Flexible'}</span>
                  </div>
                  <Link href="/auth/register"><Button size="sm" className="w-full">Enroll</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  )
}
