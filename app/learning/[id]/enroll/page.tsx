import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Button } from '@/components/ui/button'
import { CourseEnrollForm } from '@/components/learning/course-enroll-form'
import { getCourseById } from '@/lib/platform/queries'

export default async function CourseEnrollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await getCourseById(id)
  if (!course) notFound()

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-sm mb-2">Course enrollment</p>
          <h1 className="text-3xl font-bold">{course.title}</h1>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/learning/${course.id}`}>
            <Button variant="ghost" size="sm">← Back to course details</Button>
          </Link>
        </div>
        <CourseEnrollForm course={course} />
      </section>
      <SiteFooter />
    </main>
  )
}
