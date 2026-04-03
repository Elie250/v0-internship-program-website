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
  permissions?: Record<string, boolean>;
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

  const ADMIN_TOKEN = 'admin_token'; // or process.env.ADMIN_SECRET_TOKEN

  // Check authentication and load data
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (!adminAuth) {
      router.push('/admin/login');
      return;
    }
    setIsAuthenticated(true);
    fetchApplications();
  }, [router]);

  // Filter applications
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

  // Fetch applications from API
  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin-dashboard', {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      const data = await res.json();
      if (res.ok) {
        setApplications(data.data || []);
      } else {
        console.error('Error fetching applications:', data.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setIsLoading(false);
  };

  // Update status in Supabase
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const app = applications.find(a => a.id === id);
    const currentPermissions = app?.permissions || {
      webinars: true,
      trainings: false,
      courseMaterials: false,
      assignments: false,
      certificates: false,
    };

    try {
      const res = await fetch('/api/admin-dashboard', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({ id, status: newStatus, permissions: currentPermissions }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchApplications(); // refresh data
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle permission for a student
  const togglePermission = (studentId: string, permission: string) => {
    setApplications(prev =>
      prev.map(app => {
        if (app.id === studentId) {
          const perms = app.permissions || {};
          return { ...app, permissions: { ...perms, [permission]: !perms[permission] } };
        }
        return app;
      })
    );
  };

  // Save all permissions to Supabase
  const savePermissions = async () => {
    try {
      for (const app of applications) {
        if (app.status === 'Approved') {
          await fetch('/api/admin-dashboard', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${ADMIN_TOKEN}`,
            },
            body: JSON.stringify({ id: app.id, permissions: app.permissions }),
          });
        }
      }
      alert('Permissions saved successfully!');
      fetchApplications(); // refresh
    } catch (err) {
      console.error(err);
    }
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

        {/* ... keep rest of tabs UI exactly as before ... */}

      </div>
    </main>
  );
}