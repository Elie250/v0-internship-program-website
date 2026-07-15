import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { BrainArcadeClient } from '@/components/brain-training/arcade-client'

/** Server page: keeps async SiteFooter out of the client bundle (fixes Arcade crash). */
export default function PublicBrainTrainingPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <SiteHeader />
      <BrainArcadeClient />
      <SiteFooter />
    </main>
  )
}
