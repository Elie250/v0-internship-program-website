'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  createAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserStatus,
} from '@/app/actions/admin-users'
import {
  USER_ROLES,
  type AdminUserRecord,
  type AdminUserRole,
} from '@/lib/admin/user-roles'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Trash2, Edit2, KeyRound, Ban, CheckCircle2 } from 'lucide-react'
import { ROLE_LABELS } from '@/types/platform'

const STATUS_OPTIONS = ['all', 'active', 'inactive', 'suspended'] as const

export default function UserManagementTab() {
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
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

  const handleCreate = async () => {
    const result = await createAdminUser(formData)
    if (!result.success) {
      setError(result.error || 'Create failed')
      return
    }
    setFormData({ email: '', firstName: '', lastName: '', password: '', role: 'student' })
    setIsCreateOpen(false)
    loadUsers()
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    const result = await updateAdminUser({
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
    loadUsers()
  }

  const handleResetPassword = async () => {
    if (!resetUserId) return
    const result = await resetAdminUserPassword(resetUserId, newPassword)
    if (!result.success) {
      setError(result.error || 'Reset failed')
      return
    }
    setResetUserId(null)
    setNewPassword('')
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
    map[value] || 'bg-muted text-muted-foreground'

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
    inactive: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Create, edit, activate, deactivate, and reset passwords.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All statuses' : status}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
              <DialogDescription>Add a new platform user with hashed password.</DialogDescription>
            </DialogHeader>
            <UserForm formData={formData} setFormData={setFormData} showPassword />
            <Button onClick={handleCreate} className="w-full">Create</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-muted-foreground">Loading users…</p>
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
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                          {user.status ?? 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end flex-wrap">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(user)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setResetUserId(user.id)}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          {user.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateAdminUserStatus(user.id, 'inactive').then(loadUsers)
                              }
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateAdminUserStatus(user.id, 'active').then(loadUsers)
                              }
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Delete this user?')) {
                                deleteAdminUser(user.id).then(loadUsers)
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <UserForm formData={formData} setFormData={setFormData} />
          <Button onClick={handleUpdate} className="w-full">Save changes</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetUserId)} onOpenChange={() => setResetUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            placeholder="New password (min 6 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button onClick={handleResetPassword} className="w-full">Reset password</Button>
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
          className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background"
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
