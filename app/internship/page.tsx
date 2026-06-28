import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPublishedInternships } from '@/lib/platform/queries'

export default async function InternshipPage() {
  const internships = await getPublishedInternships()

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-[#1e3a5f] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Internship Portal</h1>
          <p className="text-white/80">Apply for engineering internships. Listings and requirements are admin-managed.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        {internships.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No internship listings yet. You can still apply using the legacy application form.
              <div className="mt-4"><Link href="/apply"><Button>Legacy Apply Form</Button></Link></div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {internships.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  {item.deadline && (
                    <p className="text-xs text-muted-foreground">Deadline: {new Date(item.deadline).toLocaleDateString()}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  <p className="text-sm mb-4 whitespace-pre-line">{item.requirements}</p>
                  <Link href={`/apply?internship=${item.id}`}><Button className="bg-[#1e3a5f]">Apply Now</Button></Link>
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
