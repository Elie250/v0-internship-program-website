import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Site configuration and operational settings. Payments use manual receipt verification — no online gateway.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planned modules</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• General site settings</p>
          <p>• SMTP / email templates</p>
          <p>• Manual payment instructions (bank / mobile money details for users)</p>
          <p>• Subscription plan labels (admin verifies receipts manually)</p>
          <p>• Maintenance mode & backups</p>
        </CardContent>
      </Card>
    </div>
  )
}
