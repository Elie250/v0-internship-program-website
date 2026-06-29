import Link from 'next/link'
import Image from 'next/image'
import { Mail, MapPin, MessageCircle, Phone, Clock } from 'lucide-react'
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
      <section className="text-on-dark bg-[var(--brand-navy)] py-12 px-4">
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
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative w-40 h-48 rounded-xl overflow-hidden border shrink-0">
                <Image
                  src={FOUNDER.photo}
                  alt={`${FOUNDER.name} — ${FOUNDER.title}`}
                  fill
                  className="object-cover object-top"
                  sizes="160px"
                />
              </div>
              <div>
                <p className="font-semibold text-lg text-[#1e3a5f]">{FOUNDER.name}</p>
                <p className="text-muted-foreground">{FOUNDER.title}</p>
              </div>
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

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Reach {COMPANY.brandName} for training enquiries, partnerships, or technical support.
              We respond within one business day.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex gap-3 rounded-lg border p-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-[var(--brand-navy)]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Phone</p>
                  <a href={`tel:${COMPANY.phone}`} className="text-[var(--brand-navy)] font-medium hover:underline">
                    {COMPANY.phoneDisplay}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">{COMPANY.timezone} · Mon–Fri 8:00–17:00</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border p-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-[var(--brand-navy)]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Email</p>
                  <a href={`mailto:${COMPANY.email}`} className="text-[var(--brand-navy)] font-medium hover:underline break-all">
                    {COMPANY.email}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">We reply within 24 hours</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border p-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-[var(--brand-navy)]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Location</p>
                  <p className="text-foreground font-medium">{COMPANY.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">{COMPANY.region}</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border p-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-[var(--brand-navy)]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">WhatsApp</p>
                  <a
                    href={`https://wa.me/${COMPANY.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--brand-navy)] font-medium hover:underline"
                  >
                    Chat on WhatsApp
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">{COMPANY.phoneDisplay}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--brand-navy)]/15 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-[var(--brand-navy)]" />
                <p className="font-semibold">Business hours</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-2 text-sm">
                <div className="flex justify-between sm:flex-col sm:gap-0.5">
                  <span className="text-muted-foreground">Mon–Fri</span>
                  <span className="font-medium">8:00 AM – 5:00 PM</span>
                </div>
                <div className="flex justify-between sm:flex-col sm:gap-0.5">
                  <span className="text-muted-foreground">Saturday</span>
                  <span className="font-medium">9:00 AM – 1:00 PM</span>
                </div>
                <div className="flex justify-between sm:flex-col sm:gap-0.5">
                  <span className="text-muted-foreground">Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
            </div>

            <Link href="/contact">
              <Button className="bg-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/90">
                Send us a message
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
      <SiteFooter />
    </main>
  )
}
