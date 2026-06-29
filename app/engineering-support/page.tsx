import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { SupportTicketForm } from '@/components/support/support-ticket-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupportCategories } from '@/lib/platform/queries'

export default async function EngineeringSupportPage() {
  const categories = await getSupportCategories()

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="text-on-dark bg-[var(--brand-navy)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Engineering Support Portal</h1>
          <p className="text-white/80">Submit technical support requests. Categories and ticket workflow are admin-managed.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Support Categories</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {categories.length === 0 ? (
                <p>Categories will appear once configured by an administrator.</p>
              ) : (
                categories.map((cat) => <p key={cat.id}>• {cat.name}</p>)
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Ticket Status Flow</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>Open → Assigned → In Progress</p>
              <p>Waiting Customer → Resolved → Closed</p>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <SupportTicketForm categories={categories} />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
