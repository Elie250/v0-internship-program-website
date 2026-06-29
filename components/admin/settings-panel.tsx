import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SiteBrandingPanel from '@/components/admin/site-branding'
import { getSiteBranding } from '@/app/actions/admin-branding'
import { COMPANY } from '@/lib/company/constants'

export default async function SettingsPanel() {
  const branding = await getSiteBranding()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Site configuration for {COMPANY.brandName}. Payments use manual receipt verification — no online gateway.
        </p>
      </div>

      <SiteBrandingPanel initialLogoUrl={branding.logoUrl} />

      <Card>
        <CardHeader>
          <CardTitle>Planned modules</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• SMTP / email templates</p>
          <p>• Manual payment instructions (bank / mobile money details for users)</p>
          <p>• Subscription plan labels (admin verifies receipts manually)</p>
          <p>• Maintenance mode & backups</p>
        </CardContent>
      </Card>
    </div>
  )
}
