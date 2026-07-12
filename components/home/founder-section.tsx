import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FOUNDER, COMPANY } from '@/lib/company/constants'

export function FounderSection({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <section className="home-section home-section--compact border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
              <Image
                src={FOUNDER.photo}
                alt={`${FOUNDER.name} — ${FOUNDER.title}`}
                fill
                className="object-cover object-top"
                sizes="96px"
              />
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)] mb-1">
                {FOUNDER.role}
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{FOUNDER.headline}</h2>
              <p className="text-sm text-slate-600 line-clamp-2">{FOUNDER.concept}</p>
            </div>
            <Link href="/about" className="shrink-0">
              <Button variant="outline" className="text-slate-800 border-slate-300">
                About {COMPANY.brandName}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="border-t border-white/10 bg-[var(--brand-navy)] text-on-dark">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-[240px_1fr] gap-10 items-start">
          <div className="mx-auto lg:mx-0 lg:sticky lg:top-8">
            <div className="relative w-52 h-64 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-white/5">
              <Image
                src={FOUNDER.photo}
                alt={`${FOUNDER.name} — ${FOUNDER.title}`}
                fill
                className="object-cover object-top"
                sizes="208px"
              />
            </div>
            <p className="text-center text-sm font-medium mt-4">{FOUNDER.name}</p>
            <p className="text-center text-xs text-white/70">{FOUNDER.title}</p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-sky)] mb-2">
              {FOUNDER.role}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {FOUNDER.headline}
            </h2>
            <p className="text-white/90 leading-relaxed mb-5 text-lg">{FOUNDER.concept}</p>
            <p className="text-white/80 leading-relaxed mb-6">{FOUNDER.bio}</p>

            <div className="flex flex-wrap gap-3">
              <Link href="/learning">
                <Button className="bg-white text-[#1e3a5f] hover:bg-white/90">View programmes</Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  About {COMPANY.brandName}
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  Contact us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
