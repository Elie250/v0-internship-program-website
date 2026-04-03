'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, LogOut } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  status: 'Pending' | 'Approved' | 'Active' | 'Suspended' | 'Rejected';
  registration_date: string;
  permission_level: 'Student' | 'Mentor' | 'Admin';
  hours_logged: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | User['status']>('All');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPermission, setNewPermission] = useState<User['permission_level']>('Student');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch users from API
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (!adminAuth) router.push('/admin/login');

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin-dashboard/users');
        const data = await res.json();
        if (data.success) {
          setUsers(data.data);
          setFilteredUsers(data.data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  // Filter & search
  useEffect(() => {
    let temp = users;
    if (statusFilter !== 'All') temp = temp.filter(u => u.status === statusFilter);
    if (searchTerm) temp = temp.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(temp);
  }, [searchTerm, statusFilter, users]);

  // Update permission
  const handleUpdatePermission = (user: User) => {
    setSelectedUser(user);
    setNewPermission(user.permission_level);
    setShowModal(true);
  };

  const confirmUpdatePermission = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch('/api/admin-dashboard/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, permission_level: newPermission }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === selectedUser.id ? data.data : u));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setShowModal(false);
      setSelectedUser(null);
    }
  };

  // Change status
  const handleChangeStatus = async (user: User, status: User['status']) => {
    try {
      const res = await fetch('/api/admin-dashboard/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, status }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === user.id ? data.data : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete user
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch('/api/admin-dashboard/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/admin/login');
  };

  const statusColor = (status: User['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      case 'Rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) return <p className="text-center py-10">Loading users...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-4xl font-bold">User Management</h1>
        <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4 flex-col sm:flex-row">
        <Input
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Users Table */}
      <Card className="shadow-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th>Email</th>
              <th>Program</th>
              <th>Status</th>
              <th>Permission</th>
              <th>Hours</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-2">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.program}</td>
                <td>
                  <select
                    value={user.status}
                    onChange={e => handleChangeStatus(user, e.target.value as User['status'])}
                    className={`px-2 py-1 rounded-full text-xs ${statusColor(user.status)}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
                <td>
                  <Badge
                    className={
                      user.permission_level === 'Admin' ? 'bg-red-100 text-red-800'
                        : user.permission_level === 'Mentor' ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {user.permission_level}
                  </Badge>
                </td>
                <td>{user.hours_logged}h</td>
                <td className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUpdatePermission(user)}>
                    <Edit className="w-4 h-4" /> Perms
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Permission Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full shadow-xl">
            <CardHeader>
              <CardTitle>Update Permission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{selectedUser.name} ({selectedUser.email})</p>
              <select
                value={newPermission}
                onChange={e => setNewPermission(e.target.value as User['permission_level'])}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Student">Student</option>
                <option value="Mentor">Mentor</option>
                <option value="Admin">Admin</option>
              </select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={confirmUpdatePermission} className="flex-1 bg-blue-600 hover:bg-blue-700">Update</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}