import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSiteSetting } from '@/lib/platform/queries'

export default async function AboutPage() {
  const about = await getSiteSetting(
    'about_content',
    'Engineering Hub is a multi-portal engineering ecosystem by Energy & Logics, focused on education, career development, technical support, internships, and an engineering marketplace.'
  )
  const mission = await getSiteSetting(
    'mission_content',
    'We bridge skills with industry through hands-on training, mentorship, and real-world engineering support.'
  )

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-[#1e3a5f] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">About Us</h1>
          <p className="text-white/80">Energy & Logics Engineering Hub</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <Card>
          <CardHeader><CardTitle>Who We Are</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground whitespace-pre-line">{about}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Our Mission</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground whitespace-pre-line">{mission}</p></CardContent>
        </Card>
      </section>
      <SiteFooter />
    </main>
  )
}
