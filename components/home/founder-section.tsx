import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { FOUNDER, COMPANY } from '@/lib/company/constants'
import { Quote } from 'lucide-react'

export function FounderSection() {
  return (
    <section className="border-t bg-[#1e3a5f] text-white">
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
            <p className="text-sm font-semibold uppercase tracking-wider text-[#7eb8e8] mb-2">
              {FOUNDER.role}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {FOUNDER.headline}
            </h2>
            <p className="text-white/90 leading-relaxed mb-5 text-lg">{FOUNDER.concept}</p>
            <p className="text-white/80 leading-relaxed mb-6">{FOUNDER.bio}</p>

            <blockquote className="flex gap-3 rounded-xl bg-white/10 border border-white/15 p-4 mb-6">
              <Quote className="h-5 w-5 shrink-0 text-[#7eb8e8] mt-0.5" />
              <p className="text-sm italic text-white/90">{FOUNDER.quote}</p>
            </blockquote>

            <ul className="grid sm:grid-cols-2 gap-2 mb-8">
              {FOUNDER.experienceHighlights.map((item) => (
                <li
                  key={item}
                  className="text-sm bg-white/10 rounded-lg border border-white/10 px-3 py-2.5"
                >
                  {item}
                </li>
              ))}
            </ul>

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
