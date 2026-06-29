import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/admin/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROLE_LABELS } from '@/types/platform'

export default function RolesPermissionsPanel() {
  const roles = Object.keys(ROLE_PERMISSIONS)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-1">
          RBAC matrix — run <code className="text-xs">scripts/06-rbac-permissions.sql</code> in Supabase to persist roles in the database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission keys ({ALL_PERMISSIONS.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ALL_PERMISSIONS.map((permission) => (
              <span
                key={permission}
                className="rounded-md border bg-muted px-2 py-1 text-xs font-mono"
              >
                {permission}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="text-base">
                {ROLE_LABELS[role] ?? role}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {ROLE_PERMISSIONS[role].map((permission) => (
                  <li key={permission} className="font-mono text-xs">
                    {permission}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
