'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, FileText, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('admin_authenticated');
    if (!token) router.push('/admin/login');
    fetchApplications();
  }, [router]);

  const fetchApplications = async () => {
    setIsLoading(true);
    const res = await fetch('/api/admin-dashboard', {
      headers: { Authorization: 'Bearer admin_token' },
    });
    const data = await res.json();
    if (data.success) setApplications(data.data || []);
    setIsLoading(false);
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'Pending').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/admin/login');
  };

  if (isLoading) return <p className="p-8">Loading dashboard...</p>;

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage applications, permissions, and course access</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader><CardTitle>Total Applications</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-yellow-600">{stats.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Approved</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">{stats.approved}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rejected</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">{stats.rejected}</CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/admin/users">
          <Card className="cursor-pointer hover:shadow-lg transition">
            <CardHeader>
              <CardTitle>
                <Users className="inline w-5 h-5 mr-2" /> Manage Users
              </CardTitle>
            </CardHeader>
            <CardContent>View applications and manage permissions</CardContent>
          </Card>
        </Link>
        <Link href="/admin/webinars">
          <Card className="cursor-pointer hover:shadow-lg transition">
            <CardHeader>
              <CardTitle>
                <Video className="inline w-5 h-5 mr-2" /> Manage Webinars
              </CardTitle>
            </CardHeader>
            <CardContent>Add, edit, or remove webinars</CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}