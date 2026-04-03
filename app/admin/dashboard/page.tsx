'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, Users, FileText, Video, BarChart3, Settings, Search, Eye, Lock, Unlock } from 'lucide-react';

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  program: string;
  status: string;
  created_at: string;
  agreed_to_terms: boolean;
}

interface StudentPermissions {
  webinars: boolean;
  trainings: boolean;
  courseMaterials: boolean;
  assignments: boolean;
  certificates: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Application | null>(null);
  const [studentPermissions, setStudentPermissions] = useState<Record<string, StudentPermissions>>({});

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (!adminAuth) {
      const timer = setTimeout(() => router.push('/admin/login'), 100);
      return () => clearTimeout(timer);
    }
    setIsAuthenticated(true);
    loadData();
  }, [router]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredApps(
        applications.filter(app =>
          app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredApps(applications);
    }
  }, [searchTerm, applications]);

  const loadData = () => {
    // Load from localStorage or Supabase
    const savedApps = localStorage.getItem('applications');
    if (savedApps) {
      setApplications(JSON.parse(savedApps));
    }
    const savedPerms = localStorage.getItem('student_permissions');
    if (savedPerms) {
      setStudentPermissions(JSON.parse(savedPerms));
    }
    setIsLoading(false);
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    const updated = applications.map(app =>
      app.id === id ? { ...app, status: newStatus } : app
    );
    setApplications(updated);
    localStorage.setItem('applications', JSON.stringify(updated));
    
    if (newStatus === 'Approved') {
      // Grant default permissions
      const newPerms = {
        webinars: true,
        trainings: false,
        courseMaterials: false,
        assignments: false,
        certificates: false,
      };
      setStudentPermissions(prev => ({
        ...prev,
        [id]: newPerms
      }));
    }
  };

  const togglePermission = (studentId: string, permission: keyof StudentPermissions) => {
    setStudentPermissions(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [permission]: !prev[studentId]?.[permission]
      }
    }));
  };

  const savePermissions = () => {
    localStorage.setItem('student_permissions', JSON.stringify(studentPermissions));
    alert('Permissions saved successfully!');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/admin/login');
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 py-8 px-4 text-center">Loading dashboard...</div>;
  if (!isAuthenticated) return null;

  const stats = {
    totalApps: applications.length,
    pending: applications.filter(a => a.status === 'Pending').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600 mt-2">Manage applications, permissions, and course access</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader><CardTitle className="text-sm">Total Applications</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-blue-600">{stats.totalApps}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Pending</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-yellow-600">{stats.pending}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Approved</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-green-600">{stats.approved}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Rejected</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-red-600">{stats.rejected}</p></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          {['overview', 'applications', 'permissions', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700">
                  <FileText className="w-4 h-4" />
                  View All Applications
                </Button>
                <Button className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700">
                  <Video className="w-4 h-4" />
                  Manage Webinars
                </Button>
                <Button className="w-full justify-start gap-2 bg-purple-600 hover:bg-purple-700">
                  <Users className="w-4 h-4" />
                  Manage Permissions
                </Button>
                <Button className="w-full justify-start gap-2 bg-slate-600 hover:bg-slate-700">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent Applications</CardTitle></CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <p className="text-slate-600">No applications yet</p>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(-5).map(app => (
                      <div key={app.id} className="flex justify-between items-center py-2 border-b border-slate-100">
                        <div>
                          <p className="font-semibold text-sm">{app.full_name}</p>
                          <p className="text-xs text-slate-600">{app.program}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          app.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Applications</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredApps.length === 0 ? (
                <p className="text-center text-slate-600 py-8">No applications found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold">Name</th>
                        <th className="text-left py-3 px-4 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 font-semibold">Program</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.map(app => (
                        <tr key={app.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="py-3 px-4">{app.full_name}</td>
                          <td className="py-3 px-4 text-sm">{app.email}</td>
                          <td className="py-3 px-4">{app.program}</td>
                          <td className="py-3 px-4">
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                              className={`px-3 py-1 rounded text-sm font-semibold border-none ${
                                app.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              <option>Pending</option>
                              <option>Approved</option>
                              <option>Rejected</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {new Date(app.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              onClick={() => setSelectedStudent(app)}
                              size="sm"
                              variant="outline"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <Card>
            <CardHeader>
              <CardTitle>Student Permissions Management</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.filter(a => a.status === 'Approved').length === 0 ? (
                <p className="text-slate-600">No approved students yet</p>
              ) : (
                <div className="space-y-6">
                  {applications.filter(a => a.status === 'Approved').map(student => {
                    const perms = studentPermissions[student.id] || {
                      webinars: true,
                      trainings: false,
                      courseMaterials: false,
                      assignments: false,
                      certificates: false,
                    };
                    return (
                      <div key={student.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">{student.full_name}</h3>
                            <p className="text-sm text-slate-600">{student.email}</p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          {Object.entries(perms).map(([key, value]) => (
                            <button
                              key={key}
                              onClick={() => togglePermission(student.id, key as keyof StudentPermissions)}
                              className={`flex items-center gap-3 p-3 rounded border transition ${
                                value
                                  ? 'bg-green-50 border-green-200 text-green-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              {value ? (
                                <Unlock className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                              <span className="capitalize">{key}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <Button onClick={savePermissions} className="w-full bg-blue-600 hover:bg-blue-700">
                    Save All Permissions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card>
            <CardHeader><CardTitle>Admin Settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Course Materials</h3>
                <p className="text-sm text-slate-600 mb-3">Manage what materials are available to students</p>
                <div className="space-y-2">
                  {['Webinars', 'Trainings', 'Course Materials', 'Assignments', 'Certificates'].map(item => (
                    <label key={item} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-slate-200">
                <h3 className="font-semibold mb-2">System Settings</h3>
                <p className="text-sm text-slate-600 mb-3">Configure application behavior</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold">Auto-approve applications after days</label>
                    <Input type="number" placeholder="7" defaultValue="7" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Email notifications for new applications</label>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm">Enable</Button>
                      <Button variant="outline" size="sm">Disable</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader className="flex justify-between items-start">
                <CardTitle>{selectedStudent.full_name}</CardTitle>
                <Button onClick={() => setSelectedStudent(null)} variant="outline" size="sm">Close</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-semibold">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Phone</p>
                    <p className="font-semibold">{selectedStudent.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Program</p>
                    <p className="font-semibold">{selectedStudent.program}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <p className="font-semibold">{selectedStudent.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
