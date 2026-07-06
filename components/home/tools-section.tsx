import Link from 'next/link'
import { ArrowRight, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ENGINEERING_TOOL_CATEGORIES } from '@/lib/engineering/tool-categories'

export function ToolsSection() {
  return (
    <section id="tools" className="py-16 px-4 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className="section-eyebrow mb-2">Engineering tools</p>
          <h2 className="section-title mb-3 flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8 text-[var(--brand-navy)]" />
            Free calculators for the field
          </h2>
          <p className="text-slate-600">
            Electrical, installation, embedded, and solar helpers — built for students and technicians
            in our programmes. No login required.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ENGINEERING_TOOL_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <Card key={cat.id} className="border-slate-200 h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center mb-2">
                    <Icon className="h-5 w-5 text-[var(--brand-navy)]" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">{cat.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm text-slate-600 flex-1">{cat.summary}</p>
                  <Link href={`/tools#${cat.id}`} className="no-underline hover:no-underline">
                    <Button variant="outline" className="w-full text-slate-800 border-slate-300 group">
                      Open tools
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/tools">
            <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              View all engineering tools
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
