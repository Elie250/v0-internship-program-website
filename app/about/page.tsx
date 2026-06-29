import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSiteSetting } from '@/lib/platform/queries'
import {
  ABOUT_DEFAULT,
  COMPANY,
  FOUNDER,
  MISSION_DEFAULT,
  PAYMENT,
  TRAINING_PROGRAMS,
} from '@/lib/company/constants'

export default async function AboutPage() {
  const about = await getSiteSetting('about_content', ABOUT_DEFAULT)
  const mission = await getSiteSetting('mission_content', MISSION_DEFAULT)

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-[#1e3a5f] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-white/70 text-sm font-medium mb-2">{COMPANY.brandName} Ltd</p>
          <h1 className="text-4xl font-bold mb-2">About Us</h1>
          <p className="text-white/85 text-lg">
            Practical engineering training and technical support from {COMPANY.address}.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <Card>
          <CardHeader><CardTitle>Who We Are</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground whitespace-pre-line leading-relaxed">{about}</p></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Our Mission</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground whitespace-pre-line leading-relaxed">{mission}</p></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{FOUNDER.role}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-lg text-[#1e3a5f]">{FOUNDER.name}</p>
              <p className="text-muted-foreground">{FOUNDER.title}</p>
            </div>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{FOUNDER.bio}</p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {FOUNDER.experienceHighlights.map((item) => (
                <li key={item} className="text-sm border rounded-md px-3 py-2 bg-muted/30">{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Our Training Programmes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {TRAINING_PROGRAMS.map((program) => (
              <div key={program.id} className="border-b last:border-0 pb-4 last:pb-0">
                <p className="font-semibold text-[#1e3a5f]">{program.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{program.summary}</p>
              </div>
            ))}
            <Link href="/learning">
              <Button variant="outline">Browse learning portal</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              We accept payment via <strong className="text-foreground">{PAYMENT.method}</strong>.
              Pay Code: <strong className="text-foreground">{PAYMENT.momoPayCode}</strong> —{' '}
              {PAYMENT.accountName}.
            </p>
            <Link href="/payment-instructions">
              <Button size="sm" className="mt-2 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
                Full payment instructions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
      <SiteFooter />
    </main>
  )
}
