import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { ToolsCenterClient } from '@/components/tools/tools-center-client'

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <ToolsCenterClient />
      <SiteFooter />
    </main>
  )
}
