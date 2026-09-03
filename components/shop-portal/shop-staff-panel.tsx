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
import { ShopStaffPermissionMatrix } from '@/components/shop-portal/shop-staff-permission-matrix'
import { roleDisplayLabel, roleDisplayLabelKey } from '@/lib/shop/portal-nav'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import type { ShopMessageKey } from '@/lib/shop/i18n/messages/en'

type ShopStaffRole = 'salesperson' | 'inventory_manager'

const CREATE_ROLE_VALUES: ShopStaffRole[] = ['salesperson', 'inventory_manager']

const CREATE_ROLE_KEYS: Record<ShopStaffRole, ShopMessageKey> = {
  salesperson: 'role.salesperson',
  inventory_manager: 'role.inventory_manager',
}

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
  customPermissions?: string[]
  permissions?: string[]
}

type StaffListResponse = { users: ShopStaffListItem[] }

function displayName(user: ShopStaffListItem): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || user.email
}

function formatDate(value: string | null, empty: string): string {
  if (!value) return empty
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return empty
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
  const t = useShopT()
  const key = roleDisplayLabelKey(role)
  const label = key ? t(key) : roleDisplayLabel(role)
  return (
    <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/15">
      {label}
    </span>
  )
}

export function ShopStaffPanel({ currentUserId }: { currentUserId: string }) {
  const t = useShopT()
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
    if (loading) return t('common.loading')
    const n = users.length
    return n === 1 ? t('staff.count', { n }) : t('staff.countPlural', { n })
  }, [loading, users.length, t])

  const emDash = t('common.emDash')

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{countLabel}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={refresh} disabled={loading || busy}>
            {t('action.refresh')}
          </Button>
          <Button
            type="button"
            className="bg-[var(--brand-navy,#1e3a5f)] hover:bg-[var(--brand-navy,#1e3a5f)]/90"
            onClick={() => setCreateOpen(true)}
            disabled={busy}
          >
            {t('staff.create')}
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
            {t('staff.searchLabel')}
          </Label>
          <Input
            id="staff-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('staff.searchPlaceholder')}
            className="bg-white"
          />
        </div>
        <div>
          <Label htmlFor="staff-role-filter" className="sr-only">
            {t('staff.filter.role')}
          </Label>
          <select
            id="staff-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">{t('staff.filter.role.all')}</option>
            <option value="admin">{t('role.admin')}</option>
            <option value="salesperson">{t('role.salesperson')}</option>
            <option value="inventory_manager">{t('role.inventory_manager')}</option>
          </select>
        </div>
        <div>
          <Label htmlFor="staff-status-filter" className="sr-only">
            {t('staff.filter.status')}
          </Label>
          <select
            id="staff-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">{t('staff.filter.status.all')}</option>
            <option value="active">{t('staff.filter.status.active')}</option>
            <option value="inactive">{t('staff.filter.status.inactive')}</option>
            <option value="suspended">{t('staff.filter.status.suspended')}</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">{t('staff.loading')}</p>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-900">{t('staff.emptyTitle')}</p>
            <p className="mt-1 text-sm text-slate-500">{t('staff.emptyBody')}</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('staff.col.name')}</th>
                    <th className="px-4 py-3 font-medium">{t('staff.col.email')}</th>
                    <th className="px-4 py-3 font-medium">{t('staff.col.role')}</th>
                    <th className="px-4 py-3 font-medium">{t('staff.col.status')}</th>
                    <th className="px-4 py-3 font-medium">{t('staff.col.created')}</th>
                    <th className="px-4 py-3 font-medium">{t('staff.col.lastSession')}</th>
                    <th className="px-4 py-3 font-medium">{t('staff.col.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {displayName(user)}
                        {user.id === currentUserId ? (
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            {t('staff.you')}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(user.createdAt, emDash)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(user.lastStaffSessionAt, emDash)}
                        {user.activeStaffSessionCount > 0 ? (
                          <span className="ml-1 text-xs text-slate-400">
                            {t('staff.activeSessions', { n: user.activeStaffSessionCount })}
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
                      {t('staff.createdPrefix', { date: formatDate(user.createdAt, emDash) })}
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
          flashSuccess(t('staff.success.created'))
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
          flashSuccess(t('staff.success.updated'))
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
          flashSuccess(t('staff.success.passwordReset'))
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
            <AlertDialogTitle>{t('staff.revoke.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('staff.revoke.desc', {
                name: revokeUser
                  ? displayName(revokeUser)
                  : t('staff.reset.descFallbackName'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('action.cancel')}</AlertDialogCancel>
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
                flashSuccess(t('staff.success.sessionsRevoked'))
                refresh()
              }}
            >
              {t('staff.revoke.confirm')}
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
  const t = useShopT()
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onEdit}>
        {t('action.edit')}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onReset}>
        {t('staff.action.resetPassword')}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onRevoke}>
        {t('staff.action.revokeSessions')}
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
    permissions: string[]
  }) => Promise<boolean>
}) {
  const t = useShopT()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ShopStaffRole>('salesperson')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [extras, setExtras] = useState<string[]>([])
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!open) {
      setFirstName('')
      setLastName('')
      setEmail('')
      setRole('salesperson')
      setPassword('')
      setConfirm('')
      setExtras([])
      setLocalError('')
    }
  }, [open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLocalError('')
    if (!firstName.trim() && !lastName.trim()) {
      setLocalError(t('staff.validation.fullName'))
      return
    }
    if (!email.trim()) {
      setLocalError(t('staff.validation.email'))
      return
    }
    if (!ALLOWED_CREATE_ROLES.includes(role)) {
      setLocalError(t('staff.validation.role'))
      return
    }
    if (password.length < 6) {
      setLocalError(t('staff.validation.passwordLength'))
      return
    }
    if (password !== confirm) {
      setLocalError(t('staff.validation.passwordMatch'))
      return
    }
    const ok = await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      role,
      password,
      permissions: extras,
    })
    if (ok) {
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('staff.create.title')}</DialogTitle>
          <DialogDescription>{t('staff.create.desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-first-name">{t('staff.field.firstName')}</Label>
              <Input
                id="create-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={busy}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-last-name">{t('staff.field.lastName')}</Label>
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
            <Label htmlFor="create-email">{t('staff.field.email')}</Label>
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
            <Label htmlFor="create-role">{t('staff.field.role')}</Label>
            <select
              id="create-role"
              value={role}
              onChange={(e) => setRole(e.target.value as ShopStaffRole)}
              disabled={busy}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {CREATE_ROLE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(CREATE_ROLE_KEYS[value])}
                </option>
              ))}
            </select>
          </div>
          <ShopStaffPermissionMatrix role={role} extras={extras} onChange={setExtras} disabled={busy} />
          <div className="space-y-2">
            <Label htmlFor="create-password">{t('staff.field.password')}</Label>
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
            <Label htmlFor="create-confirm">{t('staff.field.confirmPassword')}</Label>
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
              {t('action.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-[var(--brand-navy,#1e3a5f)] hover:bg-[var(--brand-navy,#1e3a5f)]/90"
            >
              {busy ? t('staff.create.submitting') : t('staff.create.submit')}
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
      permissions: string[]
    }
  ) => Promise<boolean>
}) {
  const t = useShopT()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ShopStaffRole>('salesperson')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [extras, setExtras] = useState<string[]>([])
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
      setExtras(user.customPermissions ?? [])
      setLocalError('')
    }
  }, [user])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setLocalError('')
    if (!email.trim()) {
      setLocalError(t('staff.validation.email'))
      return
    }
    const payload: {
      firstName: string
      lastName: string
      email: string
      role?: ShopStaffRole
      status: 'active' | 'inactive'
      permissions: string[]
    } = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      status,
      permissions: extras,
    }
    if (!isAdminTarget) {
      if (!ALLOWED_CREATE_ROLES.includes(role)) {
        setLocalError(t('staff.validation.role'))
        return
      }
      payload.role = role
    }
    await onSubmit(user.id, payload)
  }

  const adminRoleKey = user ? roleDisplayLabelKey(user.role) : null
  const adminRoleLabel = adminRoleKey
    ? t(adminRoleKey)
    : user
      ? roleDisplayLabel(user.role)
      : ''

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('staff.edit.title')}</DialogTitle>
          <DialogDescription>{t('staff.edit.desc')}</DialogDescription>
        </DialogHeader>
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">{t('staff.field.firstName')}</Label>
                <Input
                  id="edit-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">{t('staff.field.lastName')}</Label>
                <Input
                  id="edit-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t('staff.field.email')}</Label>
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
                <Label htmlFor="edit-role">{t('staff.field.role')}</Label>
                <select
                  id="edit-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as ShopStaffRole)}
                  disabled={busy}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {CREATE_ROLE_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {t(CREATE_ROLE_KEYS[value])}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                {t('staff.edit.roleReadonly', { roleLabel: adminRoleLabel })}
              </p>
            )}
            {!isAdminTarget ? (
              <ShopStaffPermissionMatrix role={role} extras={extras} onChange={setExtras} disabled={busy} />
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="edit-status">{t('staff.field.status')}</Label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                disabled={busy}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="active">{t('staff.status.active')}</option>
                <option value="inactive">{t('staff.status.inactive')}</option>
              </select>
            </div>
            {localError ? <p className="text-sm text-red-700">{localError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
                {t('action.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="bg-[var(--brand-navy,#1e3a5f)] hover:bg-[var(--brand-navy,#1e3a5f)]/90"
              >
                {busy ? t('staff.edit.saving') : t('staff.edit.save')}
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
  const t = useShopT()
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
      setLocalError(t('staff.validation.passwordLength'))
      return
    }
    if (password !== confirm) {
      setLocalError(t('staff.validation.passwordMatch'))
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
          <DialogTitle>{t('staff.reset.title')}</DialogTitle>
          <DialogDescription>
            {t('staff.reset.desc', {
              name: user ? displayName(user) : t('staff.reset.descFallbackName'),
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-password">{t('staff.field.newPassword')}</Label>
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
            <Label htmlFor="reset-confirm">{t('staff.field.confirmPassword')}</Label>
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
              {t('action.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-[var(--brand-navy,#1e3a5f)] hover:bg-[var(--brand-navy,#1e3a5f)]/90"
            >
              {busy ? t('staff.reset.resetting') : t('staff.reset.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
