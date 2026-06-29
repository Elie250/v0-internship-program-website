import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FOUNDER, COMPANY } from '@/lib/company/constants'

export function FounderSection() {
  return (
    <section className="py-16 px-4 bg-muted/20">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[240px_1fr] gap-10 items-start">
        <div className="mx-auto md:mx-0">
          <div className="w-48 h-48 rounded-2xl bg-[#1e3a5f]/10 border-2 border-dashed border-[#1e3a5f]/25 flex items-center justify-center text-center p-4">
            <p className="text-sm text-muted-foreground">
              Photo of<br />
              <span className="font-semibold text-[#1e3a5f]">{FOUNDER.name}</span>
              <br />
              coming soon
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[#1e3a5f] uppercase tracking-wide mb-2">
            {FOUNDER.role}
          </p>
          <h2 className="text-3xl font-bold text-[#1e3a5f] mb-1">{FOUNDER.name}</h2>
          <p className="text-lg text-muted-foreground mb-4">{FOUNDER.title}</p>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-6">
            {FOUNDER.bio}
          </p>
          <ul className="grid sm:grid-cols-2 gap-2 mb-6">
            {FOUNDER.experienceHighlights.map((item) => (
              <li key={item} className="text-sm bg-white rounded-md border px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link href="/about">
              <Button variant="outline">About {COMPANY.brandName}</Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">Contact us</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
