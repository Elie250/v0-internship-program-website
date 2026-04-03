'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, Users, FileText, Video, Settings, Search, Eye, Lock, Unlock } from 'lucide-react';

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

  const API_URL = '/api/admin-dashboard';
  const ADMIN_TOKEN = 'admin_token'; // same token used in your API

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (!adminAuth) {
      const timer = setTimeout(() => router.push('/admin/login'), 100);
      return () => clearTimeout(timer);
    }
    setIsAuthenticated(true);
    loadApplications();
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

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApplications(data.data);
        setFilteredApps(data.data);
      } else {
        console.error('Failed to fetch applications:', data.message);
      }
    } catch (err) {
      console.error('API error:', err);
    }
    setIsLoading(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      const updatedApps = applications.map(app =>
        app.id === id ? { ...app, status: newStatus } : app
      );
      setApplications(updatedApps);
      setFilteredApps(updatedApps);

      const res = await fetch(API_URL, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) console.error('Failed to update status:', data.message);
    } catch (err) {
      console.error('PATCH error:', err);
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

  const savePermissions = async () => {
    try {
      // Send PATCH for each student's permissions
      const promises = Object.entries(studentPermissions).map(([studentId, perms]) =>
        fetch(API_URL, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ADMIN_TOKEN}`,
          },
          body: JSON.stringify({ id: studentId, permissions: perms }),
        })
      );
      await Promise.all(promises);
      alert('Permissions saved successfully!');
    } catch (err) {
      console.error('Error saving permissions:', err);
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
      {/* ...keep all your existing JSX from here without any change */}
    </main>
  );
}