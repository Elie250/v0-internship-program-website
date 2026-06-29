'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  resetUserPermissionsToRole,
  updateUserCustomPermissions,
} from '@/app/actions/admin-roles'
import type { RoleMatrixRow, StaffUserPermissions } from '@/lib/admin/data/roles'
import type { PermissionGroup } from '@/lib/admin/permissions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Shield, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RolesPermissionsPanel() {
  const [groups, setGroups] = useState<PermissionGroup[]>([])
  const [matrix, setMatrix] = useState<RoleMatrixRow[]>([])
  const [staffUsers, setStaffUsers] = useState<StaffUserPermissions[]>([])
  const [selectedRole, setSelectedRole] = useState('admin')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/roles', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load roles')
        return
      }
      setGroups(data.groups ?? [])
      setMatrix(data.matrix ?? [])
      setStaffUsers(data.staffUsers ?? [])
      if (data.staffUsers?.[0]) {
        setSelectedUserId(data.staffUsers[0].id)
        setUserPermissions(data.staffUsers[0].customPermissions ?? [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const activeRole = useMemo(
    () => matrix.find((row) => row.role === selectedRole),
    [matrix, selectedRole]
  )

  const selectedStaff = useMemo(
    () => staffUsers.find((user) => user.id === selectedUserId),
    [staffUsers, selectedUserId]
  )

  const adminRoles = matrix.filter((row) => row.canAccessAdmin)

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId)
    const user = staffUsers.find((entry) => entry.id === userId)
    setUserPermissions(user?.customPermissions ?? [])
    setSuccess('')
  }

  const toggleUserPermission = (key: string) => {
    setUserPermissions((current) =>
      current.includes(key) ? current.filter((p) => p !== key) : [...current, key]
    )
  }

  const saveUserPermissions = async () => {
    if (!selectedUserId) return
    setSaving(true)
    setSuccess('')
    const result = await updateUserCustomPermissions(selectedUserId, userPermissions)
    if (!result.success) {
      setError(result.error || 'Save failed')
    } else {
      setSuccess('Custom permissions saved. User must log in again for changes to apply.')
      setError('')
      await load()
    }
    setSaving(false)
  }

  const resetUserToRole = async () => {
    if (!selectedUserId) return
    setSaving(true)
    const result = await resetUserPermissionsToRole(selectedUserId)
    if (!result.success) {
      setError(result.error || 'Reset failed')
    } else {
      setSuccess('Permissions reset to role defaults.')
      await load()
    }
    setSaving(false)
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading roles & permissions…</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#1e3a5f]" />
          Roles & Permissions
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Control who can access each part of the admin panel. Role defaults apply to every user with
          that role; add custom permissions below for individual staff accounts.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
          {success}
        </p>
      ) : null}

      <Tabs defaultValue="matrix">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="matrix">Permission matrix</TabsTrigger>
          <TabsTrigger value="role-detail">Role detail</TabsTrigger>
          <TabsTrigger value="users">User overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Full access matrix</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium sticky left-0 bg-background">
                      Permission
                    </th>
                    {adminRoles.map((role) => (
                      <th key={role.role} className="text-center py-2 px-2 font-medium text-xs">
                        {role.label.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <Fragment key={group.id}>
                      <tr className="bg-muted/40">
                        <td
                          colSpan={adminRoles.length + 1}
                          className="py-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {group.label}
                        </td>
                      </tr>
                      {group.permissions.map((perm) => (
                        <tr key={perm.key} className="border-b border-border/50">
                          <td className="py-2 pr-4 sticky left-0 bg-background">
                            <p className="font-medium">{perm.label}</p>
                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                          </td>
                          {adminRoles.map((role) => {
                            const has = role.permissions.includes(perm.key)
                            return (
                              <td key={`${role.role}-${perm.key}`} className="text-center py-2 px-2">
                                {has ? (
                                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role-detail" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {matrix.map((role) => (
              <Button
                key={role.role}
                size="sm"
                variant={selectedRole === role.role ? 'default' : 'outline'}
                className={selectedRole === role.role ? 'bg-[#1e3a5f]' : ''}
                onClick={() => setSelectedRole(role.role)}
              >
                {role.label}
              </Button>
            ))}
          </div>

          {activeRole ? (
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{activeRole.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{activeRole.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={activeRole.canAccessAdmin ? 'default' : 'secondary'}>
                      {activeRole.canAccessAdmin ? 'Admin panel access' : 'No admin access'}
                    </Badge>
                    <Badge variant="outline">{activeRole.permissions.length} permissions</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Granted permissions</p>
                    <ul className="space-y-1 max-h-64 overflow-y-auto">
                      {activeRole.permissions.map((perm) => (
                        <li key={perm} className="text-xs font-mono bg-muted rounded px-2 py-1">
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin menu preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeRole.navSections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No admin sections visible for this role.</p>
                  ) : (
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {activeRole.navSections.map((section) => (
                        <li
                          key={section}
                          className="text-sm rounded-md border bg-muted/30 px-3 py-2"
                        >
                          {section}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom permissions per staff user</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {staffUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No staff accounts with admin access found.</p>
              ) : (
                <>
                  <div>
                    <Label>Staff member</Label>
                    <Select value={selectedUserId} onValueChange={handleUserSelect}>
                      <SelectTrigger className="mt-1 max-w-md">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStaff ? (
                    <>
                      <div className="rounded-lg border bg-muted/20 p-4 text-sm space-y-1">
                        <p>
                          <span className="font-medium">Email:</span> {selectedStaff.email}
                        </p>
                        <p>
                          <span className="font-medium">Role defaults:</span>{' '}
                          {selectedStaff.roleDefaults.length} permissions
                        </p>
                        <p>
                          <span className="font-medium">Effective total:</span>{' '}
                          {selectedStaff.effectivePermissions.length} permissions
                        </p>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Custom permissions are <strong>added</strong> to the role defaults. Check extras
                        below for this user only.
                      </p>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map((group) => (
                          <div key={group.id} className="rounded-lg border p-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                              {group.label}
                            </p>
                            <ul className="space-y-2">
                              {group.permissions.map((perm) => {
                                const inRole = selectedStaff.roleDefaults.includes(perm.key)
                                const checked = userPermissions.includes(perm.key) || inRole
                                return (
                                  <li key={perm.key} className="flex items-start gap-2">
                                    <Checkbox
                                      id={`${selectedStaff.id}-${perm.key}`}
                                      checked={checked}
                                      disabled={inRole || selectedStaff.role === 'admin'}
                                      onCheckedChange={() => toggleUserPermission(perm.key)}
                                    />
                                    <label
                                      htmlFor={`${selectedStaff.id}-${perm.key}`}
                                      className={cn(
                                        'text-xs leading-snug cursor-pointer',
                                        inRole && 'text-muted-foreground'
                                      )}
                                    >
                                      {perm.label}
                                      {inRole ? ' (from role)' : ''}
                                    </label>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={saveUserPermissions}
                          disabled={saving || selectedStaff.role === 'admin'}
                          className="bg-[#1e3a5f]"
                        >
                          Save custom permissions
                        </Button>
                        <Button
                          variant="outline"
                          onClick={resetUserToRole}
                          disabled={saving || selectedStaff.role === 'admin'}
                        >
                          Reset to role defaults
                        </Button>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
