import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { CalculatorsClient } from '@/components/tools/calculators-client'

export default function ToolsCalculatorsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <CalculatorsClient />
      <SiteFooter />
    </main>
  )
}
