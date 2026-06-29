import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          General, email, payment, and system configuration (Phase 2 — coming next).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planned modules</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• General site settings</p>
          <p>• SMTP / email templates</p>
          <p>• Payment gateway configuration</p>
          <p>• Subscription plans</p>
          <p>• Maintenance mode & backups</p>
        </CardContent>
      </Card>
    </div>
  )
}
