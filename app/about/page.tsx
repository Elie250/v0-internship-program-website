import Link from 'next/link'
import Image from 'next/image'
import {
  Clock,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShoppingBag,
  Smartphone,
  Star,
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  COMPANY,
  FOUNDER,
  PAYMENT,
  TRAINING_PROGRAMS,
} from '@/lib/company/constants'
import { loadPublicCompanyProfile } from '@/lib/platform/site-settings'

export default async function AboutPage() {
  const profile = await loadPublicCompanyProfile()
  const about = profile.about
  const mission = profile.mission

  return (
    <main className="min-h-screen bg-background about-portal">
      <SiteHeader />
      <section className="text-on-dark bg-[var(--brand-navy)] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-white/80 text-sm font-medium mb-2">{COMPANY.brandName} Ltd</p>
          <h1 className="text-4xl font-bold mb-2">About Us</h1>
          <p className="text-white/90 text-lg max-w-2xl">
            Practical engineering training, technical support, and product supply from {profile.address}.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Who We Are</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{about}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{mission}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">{FOUNDER.role}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative w-40 h-48 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                <Image
                  src={FOUNDER.photo}
                  alt={`${FOUNDER.name} — ${FOUNDER.title}`}
                  fill
                  className="object-cover object-top"
                  sizes="160px"
                />
              </div>
              <div>
                <p className="font-semibold text-lg text-[var(--brand-navy)]">{FOUNDER.name}</p>
                <p className="text-slate-600">{FOUNDER.title}</p>
              </div>
            </div>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{FOUNDER.bio}</p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {FOUNDER.experienceHighlights.map((item) => (
                <li
                  key={item}
                  className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-50 text-slate-800"
                >
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Our Training Programmes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {TRAINING_PROGRAMS.map((program) => (
              <div key={program.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                <p className="font-semibold text-[var(--brand-navy)]">{program.title}</p>
                <p className="text-sm text-slate-600 mt-1">{program.summary}</p>
              </div>
            ))}
            <Link href="/learning">
              <Button variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-50">
                Browse learning portal
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ShoppingBag className="h-5 w-5 text-[var(--brand-navy)]" />
              Engineering Shop
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-slate-700 leading-relaxed">
              Browse components, tools, and engineering supplies through our online shop. Add items to your cart,
              submit an order with your contact details, and our team confirms availability, total, and fulfillment.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Package className="h-5 w-5 text-[var(--brand-navy)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Browse &amp; order</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Search by category, view specs, and add products to your cart from any device.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <MapPin className="h-5 w-5 text-[var(--brand-navy)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Pickup or delivery</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Local pickup at {COMPANY.address}, or delivery across Kigali after order confirmation.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm">
              <p className="font-semibold text-indigo-900">Shop payments</p>
              <p className="text-indigo-800/90 mt-1 text-xs leading-relaxed">
                Payment is arranged after we confirm your order — MTN MoMo or cash on pickup. Online checkout via
                IremboPay is coming soon for instant payment on shop orders.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/shop">
                <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                  Visit the shop
                </Button>
              </Link>
              <Link href="/payment-instructions">
                <Button variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-50">
                  Payment instructions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Smartphone className="h-5 w-5 text-[var(--brand-navy)] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{PAYMENT.method}</p>
                <p className="text-slate-700">
                  Pay Code:{' '}
                  <strong className="text-[var(--brand-navy)]">{PAYMENT.momoPayCode}</strong> — {PAYMENT.accountName}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">{PAYMENT.workflow}</p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <Globe className="h-5 w-5 text-indigo-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-indigo-900">{PAYMENT.internationalMethod}</p>
                <p className="text-xs text-indigo-800/90 leading-relaxed">
                  {PAYMENT.internationalWorkflow} IremboPay online checkout is launching soon — MTN MoMo, Airtel,
                  and international cards in one flow.
                </p>
              </div>
            </div>

            <Link href="/payment-instructions">
              <Button size="sm" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                Full payment instructions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Star className="h-5 w-5 text-[var(--brand-navy)]" />
              Reviews &amp; ratings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              Read verified feedback from students, interns, and engineering clients — or share your own experience
              with our training, shop, and support services.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/reviews">
                <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                  Read reviews
                </Button>
              </Link>
              <Link href="/reviews#write-review">
                <Button variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-50">
                  Write a review
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-700">
              Reach {COMPANY.brandName} for training enquiries, shop orders, partnerships, or technical support.
              We respond within one business day.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex gap-3 rounded-lg border border-slate-200 p-4 bg-white">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-[var(--brand-navy)]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Phone</p>
                  <a href={`tel:${COMPANY.phone}`} className="text-[var(--brand-navy)] font-medium hover:underline">
                    {COMPANY.phoneDisplay}
                  </a>
                  <p className="text-xs text-slate-600 mt-1">{COMPANY.timezone} · Mon–Fri 8:00–17:00</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-slate-200 p-4 bg-white">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-[var(--brand-navy)]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Email</p>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="text-[var(--brand-navy)] font-medium hover:underline break-all"
                  >
                    {COMPANY.email}
                  </a>
                  <p className="text-xs text-slate-600 mt-1">We reply within 24 hours</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-slate-200 p-4 bg-white">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-[var(--brand-navy)]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Location</p>
                  <p className="text-slate-800 font-medium">{COMPANY.address}</p>
                  <p className="text-xs text-slate-600 mt-1">{COMPANY.region}</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-slate-200 p-4 bg-white">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-[var(--brand-navy)]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">WhatsApp</p>
                  <a
                    href={`https://wa.me/${COMPANY.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--brand-navy)] font-medium hover:underline"
                  >
                    Chat on WhatsApp
                  </a>
                  <p className="text-xs text-slate-600 mt-1">{COMPANY.phoneDisplay}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-[var(--brand-navy)]" />
                <p className="font-semibold text-slate-900">Business hours</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-2 text-sm">
                <div className="flex justify-between sm:flex-col sm:gap-0.5">
                  <span className="text-slate-600">Mon–Fri</span>
                  <span className="font-medium text-slate-900">8:00 AM – 5:00 PM</span>
                </div>
                <div className="flex justify-between sm:flex-col sm:gap-0.5">
                  <span className="text-slate-600">Saturday</span>
                  <span className="font-medium text-slate-900">9:00 AM – 1:00 PM</span>
                </div>
                <div className="flex justify-between sm:flex-col sm:gap-0.5">
                  <span className="text-slate-600">Sunday</span>
                  <span className="font-medium text-slate-900">Closed</span>
                </div>
              </div>
            </div>

            <Link href="/contact">
              <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
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
