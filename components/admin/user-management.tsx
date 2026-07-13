'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { AdminUserRecord, AdminUserRole } from '@/lib/admin/user-roles'
import { USER_ROLES } from '@/lib/admin/user-roles'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit2, KeyRound, Ban, CheckCircle2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { ROLE_LABELS } from '@/types/platform'

const STATUS_OPTIONS = ['all', 'active', 'pending_approval', 'inactive', 'suspended'] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]

function parseStatusFilter(value: string | null): StatusFilter {
  return STATUS_OPTIONS.includes(value as StatusFilter) ? (value as StatusFilter) : 'all'
}

async function patchUser(
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string; message?: string }> {
  const res = await fetch('/api/admin/users', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: data.error || `Request failed (${res.status})` }
  }
  return { success: true, message: data.message }
}

async function postUser(
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string; message?: string }> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: data.error || `Request failed (${res.status})` }
  }
  return { success: true, message: data.message }
}

async function putUser(
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string; message?: string }> {
  const res = await fetch('/api/admin/users', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: data.error || `Request failed (${res.status})` }
  }
  return { success: true, message: data.message }
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-600">Loading users…</div>}>
      <UserManagementTab />
    </Suspense>
  )
}

function UserManagementTab() {
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatusFilter(searchParams.get('status'))
  )
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null)
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'student' as AdminUserRole,
  })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const qs = params.toString()
      const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ''}`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load users')
        setUsers([])
        return
      }
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, roleFilter, statusFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const runAction = async (
    userId: string,
    action: () => Promise<{ success: boolean; error?: string; message?: string }>,
    successText?: string
  ) => {
    setBusyUserId(userId)
    setError('')
    setSuccess('')
    try {
      const result = await action()
      if (!result.success) {
        setError(result.error || 'Action failed')
        return
      }
      setSuccess(result.message || successText || 'Done')
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusyUserId(null)
    }
  }

  const handleCreate = async () => {
    setError('')
    setSuccess('')
    const result = await postUser(formData)
    if (!result.success) {
      setError(result.error || 'Create failed')
      return
    }
    setFormData({ email: '', firstName: '', lastName: '', password: '', role: 'student' })
    setIsCreateOpen(false)
    setSuccess(result.message || 'User created')
    loadUsers()
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    setError('')
    setSuccess('')
    const result = await putUser({
      id: editingUser.id,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
    })
    if (!result.success) {
      setError(result.error || 'Update failed')
      return
    }
    setEditingUser(null)
    setSuccess(result.message || 'User updated')
    loadUsers()
  }

  const handleResetPassword = async () => {
    if (!resetUserId) return
    setError('')
    setSuccess('')
    const result = await patchUser({
      action: 'reset_password',
      id: resetUserId,
      newPassword,
    })
    if (!result.success) {
      setError(result.error || 'Reset failed')
      return
    }
    setResetUserId(null)
    setNewPassword('')
    setSuccess(result.message || 'Password reset')
  }

  const openEdit = (user: AdminUserRecord) => {
    setEditingUser(user)
    const role = USER_ROLES.includes(user.role as AdminUserRole)
      ? (user.role as AdminUserRole)
      : 'student'
    setFormData({
      email: user.email ?? '',
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? '',
      password: '',
      role,
    })
  }

  const badgeClass = (value: string, map: Record<string, string>) =>
    map[value] || 'bg-muted text-slate-600'

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    lecturer: 'bg-blue-100 text-blue-700',
    instructor: 'bg-blue-100 text-blue-700',
    engineer: 'bg-purple-100 text-purple-700',
    support_staff: 'bg-purple-100 text-purple-700',
    student: 'bg-green-100 text-green-700',
    registered: 'bg-green-100 text-green-700',
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending_approval: 'bg-amber-100 text-amber-900',
    inactive: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-slate-600 mt-1">
          Create, edit, and approve accounts. Lecturer and engineer self-registrations stay{' '}
          <strong>pending approval</strong> until you activate them. Adjust permissions under{' '}
          <Link href="/admin/dashboard/roles" className="text-[var(--brand-navy)] underline">
            Roles &amp; permissions
          </Link>
          .
        </p>
      </div>

      {statusFilter === 'pending_approval' && users.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-800">
          <strong>{users.length}</strong> account{users.length === 1 ? '' : 's'} waiting for approval.
          Use <strong>Approve &amp; activate</strong> to grant sign-in access and default role permissions.
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
          {success}
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex-1">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="roleFilter">Role</Label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">All roles</option>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] ?? role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="statusFilter">Status</Label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(parseStatusFilter(e.target.value))}
              className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === 'all'
                    ? 'All statuses'
                    : status === 'pending_approval'
                      ? 'Pending approval'
                      : status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
              <DialogDescription>Add a new platform user with hashed password.</DialogDescription>
            </DialogHeader>
            <UserForm formData={formData} setFormData={setFormData} showPassword />
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-slate-600">Loading users…</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-600 py-8">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                      </TableCell>
                      <TableCell>{user.email ?? '—'}</TableCell>
                      <TableCell>
                        <Badge className={badgeClass(user.role ?? '', roleColors)}>
                          {ROLE_LABELS[user.role] ?? user.role ?? 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={badgeClass(user.status ?? 'active', statusColors)}>
                          {user.status === 'pending_approval' ? 'Pending approval' : (user.status ?? 'active')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end flex-wrap items-center">
                          {user.status === 'pending_approval' ? (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-700 hover:bg-green-800 text-white h-8"
                              disabled={busyUserId === user.id}
                              onClick={() =>
                                runAction(
                                  user.id,
                                  () => patchUser({ action: 'approve', id: user.id }),
                                  `${[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email} approved`
                                )
                              }
                            >
                              <ShieldCheck className="w-4 h-4 mr-1" />
                              {busyUserId === user.id ? 'Approving…' : 'Approve'}
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyUserId === user.id}
                            onClick={() => openEdit(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyUserId === user.id}
                            onClick={() => setResetUserId(user.id)}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          {user.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Deactivate"
                              disabled={busyUserId === user.id}
                              onClick={() =>
                                runAction(user.id, () =>
                                  patchUser({ action: 'status', id: user.id, status: 'inactive' })
                                )
                              }
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : user.status !== 'pending_approval' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Activate"
                              disabled={busyUserId === user.id}
                              onClick={() =>
                                runAction(user.id, () =>
                                  patchUser({ action: 'status', id: user.id, status: 'active' })
                                )
                              }
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={busyUserId === user.id}
                            onClick={() => {
                              if (confirm('Delete this user?')) {
                                runAction(user.id, () =>
                                  patchUser({ action: 'delete', id: user.id })
                                )
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingUser)} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <UserForm formData={formData} setFormData={setFormData} />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetUserId)} onOpenChange={() => setResetUserId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            placeholder="New password (min 6 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setResetUserId(null)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserForm({
  formData,
  setFormData,
  showPassword = false,
}: {
  formData: {
    email: string
    firstName: string
    lastName: string
    password: string
    role: AdminUserRole
  }
  setFormData: (value: typeof formData) => void
  showPassword?: boolean
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>First name</Label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Last name</Label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>
      {showPassword && (
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="mt-1"
          />
        </div>
      )}
      <div>
        <Label>Role</Label>
        <select
          value={formData.role}
          onChange={(e) =>
            setFormData({ ...formData, role: e.target.value as AdminUserRole })
          }
          className="mt-1 w-full h-9 rounded-md border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:border-[var(--brand-navy)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-navy)]/25"
        >
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role] ?? role}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
