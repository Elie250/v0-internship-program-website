'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, LogOut } from 'lucide-react';

interface Student {
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
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newPermission, setNewPermission] = useState<'Student' | 'Mentor' | 'Admin'>('Student');

  // Fetch users from API
  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin-dashboard/users', {
        headers: { Authorization: 'Bearer admin_token' },
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
        setFilteredStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (!adminAuth) {
      router.push('/admin/login');
      return;
    }
    fetchStudents();
  }, [router]);

  useEffect(() => {
    let filtered = students;
    if (statusFilter !== 'All') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredStudents(filtered);
  }, [searchTerm, statusFilter, students]);

  const handleUpdatePermission = (student: Student) => {
    setSelectedStudent(student);
    setNewPermission(student.permission_level);
    setShowModal(true);
  };

  const confirmUpdatePermission = async () => {
    if (!selectedStudent) return;
    try {
      const res = await fetch('/api/admin-dashboard/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin_token',
        },
        body: JSON.stringify({ id: selectedStudent.id, permissions: newPermission }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents(students.map(s =>
          s.id === selectedStudent.id ? { ...s, permission_level: newPermission } : s
        ));
      }
    } catch (err) {
      console.error('Error updating permission:', err);
    } finally {
      setShowModal(false);
      setSelectedStudent(null);
    }
  };

  const handleChangeStatus = async (student: Student, newStatus: Student['status']) => {
    try {
      const res = await fetch('/api/admin-dashboard/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin_token',
        },
        body: JSON.stringify({ id: student.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents(students.map(s =>
          s.id === student.id ? { ...s, status: newStatus } : s
        ));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student record?')) return;
    try {
      const res = await fetch('/api/admin-dashboard/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin_token',
        },
        body: JSON.stringify({ id: studentId }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents(students.filter(s => s.id !== studentId));
      }
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/admin/login');
  };

  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      case 'Rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-slate-600">Loading students...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">User Management</h1>
            <p className="text-slate-600">Manage student permissions and track progress</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Program</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Permission</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.program}</td>
                    <td className="px-6 py-4">
                      <select
                        value={student.status}
                        onChange={(e) => handleChangeStatus(student, e.target.value as Student['status'])}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${getStatusColor(student.status)}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${student.permission_level === 'Admin' ? 'bg-red-100 text-red-800' :
                          student.permission_level === 'Mentor' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>{student.permission_level}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.hours_logged}h</td>
                    <td className="px-6 py-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleUpdatePermission(student)} className="flex items-center gap-1">
                        <Edit className="w-4 h-4" /> Perms
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteStudent(student.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Permission Modal */}
        {showModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-xl">
              <CardHeader>
                <CardTitle>Update Permission Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">Student: {selectedStudent.name}</p>
                <p className="text-sm text-slate-600">Email: {selectedStudent.email}</p>
                <select
                  value={newPermission}
                  onChange={(e) => setNewPermission(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Student">Student</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Admin">Admin</option>
                </select>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                  <Button onClick={confirmUpdatePermission} className="flex-1 bg-blue-600 hover:bg-blue-700">Update Permission</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}