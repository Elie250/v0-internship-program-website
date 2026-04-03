'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
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

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  const loadData = async () => {
    setIsLoading(true);
    // Fetch applications from Supabase
    const { data: appsData, error: appsError } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('Error fetching applications:', appsError);
    } else {
      setApplications(appsData as Application[]);
      setFilteredApps(appsData as Application[]);
    }

    // Fetch permissions from Supabase
    const { data: permsData, error: permsError } = await supabase
      .from('student_permissions')
      .select('*');

    if (permsError) {
      console.error('Error fetching permissions:', permsError);
    } else {
      const permsMap: Record<string, StudentPermissions> = {};
      (permsData || []).forEach((p: any) => {
        permsMap[p.student_id] = {
          webinars: p.webinars,
          trainings: p.trainings,
          courseMaterials: p.courseMaterials,
          assignments: p.assignments,
          certificates: p.certificates,
        };
      });
      setStudentPermissions(permsMap);
    }

    setIsLoading(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    // Update locally
    const updated = applications.map(app =>
      app.id === id ? { ...app, status: newStatus } : app
    );
    setApplications(updated);
    setFilteredApps(updated);

    // Update in Supabase
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) console.error('Error updating status:', error);

    // Grant default permissions if approved
    if (newStatus === 'Approved') {
      const newPerms: StudentPermissions = {
        webinars: true,
        trainings: false,
        courseMaterials: false,
        assignments: false,
        certificates: false,
      };
      setStudentPermissions(prev => ({ ...prev, [id]: newPerms }));

      // Insert or upsert permissions in Supabase
      const { error: permError } = await supabase
        .from('student_permissions')
        .upsert({ student_id: id, ...newPerms });

      if (permError) console.error('Error saving permissions:', permError);
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
    // Save to Supabase
    const promises = Object.entries(studentPermissions).map(([studentId, perms]) =>
      supabase.from('student_permissions').upsert({ student_id: studentId, ...perms })
    );
    await Promise.all(promises);
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
    // <-- The rest of your UI remains exactly the same as your original code -->
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      {/* ...your existing dashboard JSX here... */}
    </main>
  );
}