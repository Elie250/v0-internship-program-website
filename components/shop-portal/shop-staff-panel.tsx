'use client'

import { FormEvent, useEffect, useEffectEvent, useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { fetchStaffApi } from '@/lib/shop/staff-client'
import { roleDisplayLabel } from '@/lib/shop/portal-nav'

type ShopStaffRole = 'salesperson' | 'inventory_manager'

const CREATE_ROLES: { value: ShopStaffRole; label: string }[] = [
  { value: 'salesperson', label: 'Salesperson' },
  { value: 'inventory_manager', label: 'Inventory manager' },
]

const ALLOWED_CREATE_ROLES: ShopStaffRole[] = ['salesperson', 'inventory_manager']

export type ShopStaffListItem = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  createdAt: string | null
  lastStaffSessionAt: string | null
  activeStaffSessionCount: number
}

type StaffListResponse = { users: ShopStaffListItem[] }

function displayName(user: ShopStaffListItem): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || user.email
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

function StatusBadge({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <span
      className={
        active
          ? 'inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20'
          : 'inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20'
      }
    >
      {status}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/15">
      {roleDisplayLabel(role)}
    </span>
  )
}

export function ShopStaffPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<ShopStaffListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<ShopStaffListItem | null>(null)
  const [resetUser, setResetUser] = useState<ShopStaffListItem | null>(null)
  const [revokeUser, setRevokeUser] = useState<ShopStaffListItem | null>(null)
  const [busy, setBusy] = useState(false)

  const loadList = useEffectEvent(async (q: string, role: string, status: string) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (q.trim()) params.set('search', q.trim())
    if (role !== 'all') params.set('role', role)
    if (status !== 'all') params.set('status', status)
    const qs = params.toString()
    const result = await fetchStaffApi<StaffListResponse>(
      `/api/staff/users${qs ? `?${qs}` : ''}`
    )
    if (!result.ok) {
      setUsers([])
      setError(result.error)
      setLoading(false)
      return
    }
    setUsers(result.data.users ?? [])
    setLoading(false)
  })

  useEffect(() => {
    const handle = window.setTimeout(() => {
      startTransition(() => {
        void loadList(query, roleFilter, statusFilter)
      })
    }, 200)
    return () => window.clearTimeout(handle)
  }, [query, roleFilter, statusFilter])

  function refresh() {
    void loadList(query, roleFilter, statusFilter)
  }

  function flashSuccess(message: string) {
    setSuccess(message)
    window.setTimeout(() => setSuccess(''), 4000)
  }

  const countLabel = useMemo(() => {
    if (loading) return 'Loading…'
    const n = users.length
    return `${n} staff member${n === 1 ? '' : 's'}`
  }, [loading, users.length])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{countLabel}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={refresh} disabled={loading || busy}>
            Refresh
          </Button>
          <Button
            type="button"
            className="bg-[var(--brand-navy,#1e3a5f)] hover:bg-[var(--brand-navy,#1e3a5f)]/90"
            onClick={() => setCreateOpen(true)}
            disabled={busy}
          >
            Create Staff
          </Button>
        </div>
      </div>

      {success ? (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {success}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="staff-search" className="sr-only">
            Search staff
          </Label>
          <Input
            id="staff-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            className="bg-white"
          />
        </div>
        <div>
          <Label htmlFor="staff-role-filter" className="sr-only">
            Filter by role
          </Label>
          <select
            id="staff-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">All roles</option>
            <option value="admin">Administrator</option>
            <option value="salesperson">Salesperson</option>
            <option value="inventory_manager">Inventory manager</option>
          </select>
        </div>
        <div>
          <Label htmlFor="staff-status-filter" className="sr-only">
            Filter by status
          </Label>
          <select
            id="staff-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading staff…</p>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-900">No staff found</p>
            <p className="mt-1 text-sm text-slate-500">
              Create a salesperson or inventory manager to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Last session</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {displayName(user)}
                        {user.id === currentUserId ? (
                          <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(user.lastStaffSessionAt)}
                        {user.activeStaffSessionCount > 0 ? (
                          <span className="ml-1 text-xs text-slate-400">
                            ({user.activeStaffSessionCount} active)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <StaffActions
                          disabled={busy}
                          onEdit={() => setEditUser(user)}
                          onReset={() => setResetUser(user)}
                          onRevoke={() => setRevokeUser(user)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {users.map((user) => (
                <li key={user.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{displayName(user)}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                    <StatusBadge status={user.status} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <RoleBadge role={user.role} />
                    <span className="text-xs text-slate-500">
                      Created {formatDate(user.createdAt)}
                    </span>
                  </div>
                  <StaffActions
                    disabled={busy}
                    onEdit={() => setEditUser(user)}
                    onReset={() => setResetUser(user)}
                    onRevoke={() => setRevokeUser(user)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <CreateStaffDialog
        open={createOpen}
        busy={busy}
        onOpenChange={setCreateOpen}
        onSubmit={async (payload) => {
          setBusy(true)
          setError('')
          const result = await fetchStaffApi<{ user: ShopStaffListItem }>('/api/staff/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          setBusy(false)
          if (!result.ok) {
            setError(result.error)
            return false
          }
          setCreateOpen(false)
          flashSuccess('Staff account created.')
          refresh()
          return true
        }}
      />

      <EditStaffDialog
        user={editUser}
        busy={busy}
        onOpenChange={(open) => {
          if (!open) setEditUser(null)
        }}
        onSubmit={async (id, payload) => {
          setBusy(true)
          setError('')
          const result = await fetchStaffApi<{ user: ShopStaffListItem }>(
            `/api/staff/users/${id}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }
          )
          setBusy(false)
          if (!result.ok) {
            setError(result.error)
            return false
          }
          setEditUser(null)
          flashSuccess('Staff account updated.')
          refresh()
          return true
        }}
      />

      <ResetPasswordDialog
        user={resetUser}
        busy={busy}
        onOpenChange={(open) => {
          if (!open) setResetUser(null)
        }}
        onSubmit={async (id, newPassword) => {
          setBusy(true)
          setError('')
          const result = await fetchStaffApi<{ success: boolean }>(
            `/api/staff/users/${id}/reset-password`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newPassword }),
            }
          )
          setBusy(false)
          if (!result.ok) {
            setError(result.error)
            return false
          }
          setResetUser(null)
          flashSuccess('Password reset. Active sessions for this user were revoked.')
          refresh()
          return true
        }}
      />

      <AlertDialog
        open={Boolean(revokeUser)}
        onOpenChange={(open) => {
          if (!open) setRevokeUser(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign {revokeUser ? displayName(revokeUser) : 'this staff member'} out of
              active Shop sessions. They will need to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || !revokeUser}
              onClick={async (e) => {
                e.preventDefault()
                if (!revokeUser) return
                setBusy(true)
                setError('')
                const result = await fetchStaffApi<{ success: boolean }>(
                  `/api/staff/users/${revokeUser.id}/revoke-sessions`,
                  { method: 'POST' }
                )
                setBusy(false)
                if (!result.ok) {
                  setError(result.error)
                  return
                }
                setRevokeUser(null)
                flashSuccess('Sessions revoked.')
                refresh()
              }}
            >
              Revoke sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StaffActions({
  disabled,
  onEdit,
  onReset,
  onRevoke,
}: {
  disabled: boolean
  onEdit: () => void
  onReset: () => void
  onRevoke: () => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onEdit}>
        Edit
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onReset}>
        Reset password
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onRevoke}>
        Revoke sessions
      </Button>
    </div>
  )
}

function CreateStaffDialog({
  open,
  busy,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  busy: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: {
    firstName: string
    lastName: string
    email: string
    role: ShopStaffRole
    password: string
  }) => Promise<boolean>
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ShopStaffRole>('salesperson')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!open) {
      setFirstName('')
      setLastName('')
      setEmail('')
      setRole('salesperson')
      setPassword('')
      setConfirm('')
      setLocalError('')
    }
  }, [open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLocalError('')
    if (!firstName.trim() && !lastName.trim()) {
      setLocalError('Full name is required')
      return
    }
    if (!email.trim()) {
      setLocalError('Email is required')
      return
    }
    if (!ALLOWED_CREATE_ROLES.includes(role)) {
      setLocalError('Role must be salesperson or inventory_manager')
      return
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match')
      return
    }
    const ok = await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      role,
      password,
    })
    if (ok) {
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create staff</DialogTitle>
          <DialogDescription>
            Create a salesperson or inventory manager. Administrators cannot be created here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-first-name">First name</Label>
              <Input
                id="create-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={busy}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-last-name">Last name</Label>
              <Input
                id="create-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={busy}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-role">Role</Label>
            <select
              id="create-role"
              value={role}
              onChange={(e) => setRole(e.target.value as ShopStaffRole)}
              disabled={busy}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {CREATE_ROLES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-password">Password</Label>
            <Input
              id="create-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-confirm">Confirm password</Label>
            <Input
              id="create-confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
              autoComplete="new-password"
            />
          </div>
          {localError ? <p className="text-sm text-red-700">{localError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-[var(--brand-navy,#1e3a5f)] hover:bg-[var(--brand-navy,#1e3a5f)]/90"
            >
              {busy ? 'Creating…' : 'Create staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditStaffDialog({
  user,
  busy,
  onOpenChange,
  onSubmit,
}: {
  user: ShopStaffListItem | null
  busy: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    id: string,
    payload: {
      firstName: string
      lastName: string
      email: string
      role?: ShopStaffRole
      status: 'active' | 'inactive'
    }
  ) => Promise<boolean>
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ShopStaffRole>('salesperson')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [localError, setLocalError] = useState('')

  const isAdminTarget = user?.role === 'admin'

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
      setRole(
        user.role === 'inventory_manager' ? 'inventory_manager' : 'salesperson'
      )
      setStatus(user.status === 'inactive' ? 'inactive' : 'active')
      setLocalError('')
    }
  }, [user])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setLocalError('')
    if (!email.trim()) {
      setLocalError('Email is required')
      return
    }
    const payload: {
      firstName: string
      lastName: string
      email: string
      role?: ShopStaffRole
      status: 'active' | 'inactive'
    } = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      status,
    }
    if (!isAdminTarget) {
      if (!ALLOWED_CREATE_ROLES.includes(role)) {
        setLocalError('Role must be salesperson or inventory_manager')
        return
      }
      payload.role = role
    }
    await onSubmit(user.id, payload)
  }

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit staff</DialogTitle>
          <DialogDescription>
            Update profile and status. Role changes for administrators are not available here.
          </DialogDescription>
        </DialogHeader>
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">First name</Label>
                <Input
                  id="edit-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Last name</Label>
                <Input
                  id="edit-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
            {!isAdminTarget ? (
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <select
                  id="edit-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as ShopStaffRole)}
                  disabled={busy}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {CREATE_ROLES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Role: <strong>{roleDisplayLabel(user.role)}</strong>
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                disabled={busy}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {localError ? <p className="text-sm text-red-700">{localError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="bg-[var(--brand-navy,#1e3a5f)] hover:bg-[var(--brand-navy,#1e3a5f)]/90"
              >
                {busy ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({
  user,
  busy,
  onOpenChange,
  onSubmit,
}: {
  user: ShopStaffListItem | null
  busy: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (id: string, newPassword: string) => Promise<boolean>
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!user) {
      setPassword('')
      setConfirm('')
      setLocalError('')
    }
  }, [user])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setLocalError('')
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match')
      return
    }
    const ok = await onSubmit(user.id, password)
    if (ok) {
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {user ? displayName(user) : 'this staff member'}. Active Shop
            sessions for this account will be revoked.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-confirm">Confirm password</Label>
            <Input
              id="reset-confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
              autoComplete="new-password"
            />
          </div>
          {localError ? <p className="text-sm text-red-700">{localError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-[var(--brand-navy,#1e3a5f)] hover:bg-[var(--brand-navy,#1e3a5f)]/90"
            >
              {busy ? 'Resetting…' : 'Reset password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
