'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Users, FileText, Video, BarChart3, Settings, AlertCircle } from 'lucide-react';

interface Application {
  id: string;
  name: string;
  email: string;
  program: string;
  status: string;
  created_at: string;
}

interface Webinar {
  id: string;
  title: string;
  date: string;
  time: string;
  instructor: string;
  capacity: number;
  registrations: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (!adminAuth) {
      // Small delay to ensure we don't cause a redirect loop
      const timer = setTimeout(() => {
        router.push('/admin/login');
      }, 100);
      return () => clearTimeout(timer);
    }
    setIsAuthenticated(true);
    loadData();
    setIsLoading(false);
  }, [router]);

  const loadData = () => {
    // Load applications from localStorage (in production, this would be from API)
    const savedApplications = localStorage.getItem('applications');
    if (savedApplications) {
      setApplications(JSON.parse(savedApplications));
    }

    // Load webinars from localStorage
    const savedWebinars = localStorage.getItem('webinars');
    if (savedWebinars) {
      setWebinars(JSON.parse(savedWebinars));
    } else {
      // Initialize with sample webinars
      const sampleWebinars = [
        {
          id: '1',
          title: 'Introduction to IoT Solutions',
          date: '2025-05-15',
          time: '14:00',
          instructor: 'Dr. John Doe',
          capacity: 50,
          registrations: 28,
        },
        {
          id: '2',
          title: 'PLC Programming Basics',
          date: '2025-05-20',
          time: '10:00',
          instructor: 'Eng. Sarah Smith',
          capacity: 40,
          registrations: 35,
        },
      ];
      setWebinars(sampleWebinars);
      localStorage.setItem('webinars', JSON.stringify(sampleWebinars));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/');
  };

  const updateApplicationStatus = (id: string, newStatus: string) => {
    const updated = applications.map(app =>
      app.id === id ? { ...app, status: newStatus } : app
    );
    setApplications(updated);
    localStorage.setItem('applications', JSON.stringify(updated));
  };

  const deleteApplication = (id: string) => {
    const updated = applications.filter(app => app.id !== id);
    setApplications(updated);
    localStorage.setItem('applications', JSON.stringify(updated));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600 mt-2">Manage applications, webinars, and users</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
              <p className="text-sm text-slate-600 mt-2">
                {applications.filter(a => a.status === 'Pending').length} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Video className="w-4 h-4" />
                Webinars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{webinars.length}</p>
              <p className="text-sm text-slate-600 mt-2">Active webinars</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {applications.filter(a => a.status === 'Approved').length}
              </p>
              <p className="text-sm text-slate-600 mt-2">Approved applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">
                {applications.length > 0
                  ? Math.round((applications.filter(a => a.status === 'Approved').length / applications.length) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-slate-600 mt-2">Approval rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === 'applications'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('webinars')}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === 'webinars'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Webinars
          </button>
          <Link href="/admin/users">
            <button className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users & Permissions
            </button>
          </Link>
        </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <Card>
            <CardHeader>
              <CardTitle>Student Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No applications received yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Program</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="py-3 px-4">{app.name}</td>
                          <td className="py-3 px-4">{app.email}</td>
                          <td className="py-3 px-4">{app.program}</td>
                          <td className="py-3 px-4">
                            <select
                              value={app.status}
                              onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                              className={`px-3 py-1 rounded text-sm font-semibold ${
                                app.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : app.status === 'Approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
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
                              onClick={() => deleteApplication(app.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
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

        {/* Webinars Tab */}
        {activeTab === 'webinars' && (
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Manage Webinars</CardTitle>
              <Link href="/admin/webinars/create">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  + Create Webinar
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {webinars.length === 0 ? (
                <div className="text-center py-8">
                  <Video className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No webinars created yet</p>
                  <Link href="/admin/webinars/create">
                    <Button>Create First Webinar</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {webinars.map(webinar => (
                    <div key={webinar.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition">
                      <h3 className="font-semibold text-lg mb-2">{webinar.title}</h3>
                      <div className="space-y-2 text-sm text-slate-600 mb-4">
                        <p>📅 {webinar.date} at {webinar.time}</p>
                        <p>👨‍🏫 Instructor: {webinar.instructor}</p>
                        <p>👥 {webinar.registrations}/{webinar.capacity} registered</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-600">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <Link href="/admin/users">
                  <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700">
                    <Users className="w-4 h-4" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/admin/webinars/create">
                  <Button className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700">
                    <Video className="w-4 h-4" />
                    Create Webinar
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button className="w-full justify-start gap-2 bg-slate-600 hover:bg-slate-700">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <p className="text-slate-600">No applications yet</p>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(-5).map(app => (
                      <div key={app.id} className="flex justify-between items-center py-2 border-b border-slate-100">
                        <div>
                          <p className="font-semibold">{app.name}</p>
                          <p className="text-sm text-slate-600">{app.program}</p>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${
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
      </div>
    </main>
  );
}
