import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ENGINEERING_TOOL_CATEGORIES } from '@/lib/engineering/tool-categories'
import { HomeSectionHeader } from '@/components/home/home-section-header'

export function ToolsSection() {
  return (
    <section id="tools" className="home-section home-section--white">
      <div className="max-w-6xl mx-auto">
        <HomeSectionHeader
          eyebrow="Engineering tools"
          title="Free calculators for the field"
          description="Electrical, installation, embedded, and solar helpers — built for students and technicians in our programmes. No login required."
        />

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
