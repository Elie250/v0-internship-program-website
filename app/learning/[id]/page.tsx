import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCourseById } from '@/lib/platform/queries'
import { COMPANY } from '@/lib/company/constants'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await getCourseById(id)
  if (!course) notFound()

  const price = Number(course.pricing ?? 0)

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-10">
        <div>
          {course.thumbnail ? (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <Image src={course.thumbnail} alt={course.title} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="aspect-video rounded-lg bg-[#1e3a5f]/5 flex items-center justify-center text-muted-foreground">
              {course.title}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">{course.category?.name ?? 'Training programme'}</p>
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-4">{course.title}</h1>
          <p className="text-muted-foreground mb-6">{course.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <span>{course.difficulty ?? 'All levels'}</span>
            <span>{course.duration ?? 'Flexible schedule'}</span>
          </div>
          <p className="text-2xl font-bold mb-6">
            {price > 0 ? `${price.toLocaleString()} RWF` : 'Pricing on request'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/learning/${course.id}/enroll`}>
              <Button size="lg" className="bg-[var(--brand-navy)]">Enroll now</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">Log in</Button>
            </Link>
            <Link href="/learning">
              <Button size="lg" variant="ghost">All courses</Button>
            </Link>
          </div>
          <Card className="mt-8 border-[var(--brand-navy)]/20">
            <CardHeader>
              <CardTitle className="text-base">How enrollment works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. <strong>Create a free student account</strong> or log in.</p>
              <p>2. Enroll in this programme — your details are taken from your account.</p>
              <p>3. Pay via MTN MoMo and upload your receipt on the enrollment form.</p>
              <p>4. After payment verification (within 1 business day), materials unlock on your dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
