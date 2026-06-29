import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCategories, getPublishedCourses } from '@/lib/platform/queries'
import { COMPANY } from '@/lib/company/constants'

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
          <p className="text-white/80">
            Programmes in embedded systems, industrial control, and advanced electrical technology —
            delivered by {COMPANY.brandName} in Rwanda.
          </p>
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
        <p className="text-sm text-muted-foreground mb-6 -mt-4">
          Published courses appear here. Select a programme to apply, pay via MTN MoMo, and upload your receipt for admission.
        </p>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <p className="text-muted-foreground">
                New course schedules for Embedded Systems, Industrial Control, and Advanced Electrical
                Technology are being published soon.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact us at{' '}
                <a href={`mailto:${COMPANY.email}`} className="text-[#1e3a5f] underline">
                  {COMPANY.email}
                </a>{' '}
                or call {COMPANY.phoneDisplay} to register interest.
              </p>
              <Link href="/payment-instructions">
                <Button variant="outline" size="sm">Payment instructions (MTN MoMo)</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                {course.thumbnail ? (
                  <div className="relative h-44">
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="h-44 bg-[#1e3a5f]/5 flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
                    {course.title}
                  </div>
                )}
                <CardHeader>
                  <p className="text-xs text-muted-foreground">{course.category?.name ?? 'Uncategorized'}</p>
                  <CardTitle>{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{course.description}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>{course.difficulty ?? 'All levels'}</span>
                    <span>{course.duration ?? 'Flexible'}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#1e3a5f] mb-4">
                    {Number(course.pricing ?? 0) > 0
                      ? `${Number(course.pricing).toLocaleString()} RWF`
                      : 'Pricing on request'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/learning/${course.id}`}>
                      <Button size="sm" variant="outline" className="w-full">Details</Button>
                    </Link>
                    <Link href={`/learning/${course.id}/enroll`}>
                      <Button size="sm" className="w-full bg-[#1e3a5f]">Apply</Button>
                    </Link>
                  </div>
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
