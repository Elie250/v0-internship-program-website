'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    mentors: 0,
    totalWebinars: 0,
    totalProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (!adminAuth) router.push('/admin/login');

    const fetchStats = async () => {
      try {
        const usersRes = await fetch('/api/admin-dashboard/users');
        const usersData = await usersRes.json();
        const webinarsRes = await fetch('/api/admin-dashboard/webinars');
        const webinarsData = await webinarsRes.json();
        const projectsRes = await fetch('/api/admin-dashboard/projects');
        const projectsData = await projectsRes.json();

        const users = usersData.data || [];
        setStats({
          totalUsers: users.length,
          activeUsers: users.filter((u: any) => u.status === 'Active').length,
          mentors: users.filter((u: any) => u.permission_level === 'Mentor').length,
          totalWebinars: webinarsData.data?.length || 0,
          totalProjects: projectsData.data?.length || 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (loading) return <p className="text-center py-10">Loading dashboard...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.totalUsers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active Users</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mentors</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-purple-600">{stats.mentors}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Webinars</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{stats.totalWebinars}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-orange-600">{stats.totalProjects}</p></CardContent>
        </Card>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/admin/users"><Button>Manage Users</Button></Link>
        <Link href="/admin/webinars"><Button>Manage Webinars</Button></Link>
        <Link href="/admin/projects"><Button>Manage Projects</Button></Link>
      </div>
    </main>
  );
}