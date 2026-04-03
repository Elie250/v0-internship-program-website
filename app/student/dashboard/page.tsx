'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, CheckCircle, User } from 'lucide-react';

interface StudentData {
  id: string;
  full_name: string;
  email: string;
  program: string;
  duration: string;
  status: string;
  progress: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('student_auth_token');
    const email = localStorage.getItem('student_email');

    if (!token || !email) {
      router.push('/student/login');
      return;
    }

    const fetchStudentData = async () => {
      try {
        const res = await fetch('/api/student-dashboard', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-student-email': email
          }
        });

        if (!res.ok) {
          console.error('Dashboard API error');
          router.push('/student/login');
          return;
        }

        const data = await res.json();

        setStudent({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          program: data.program || 'N/A',
          duration: data.duration || 'N/A',
          status: data.status || 'pending',
          progress: data.progress || 0
        });

      } catch (error) {
        console.error('Error loading dashboard:', error);
        router.push('/student/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/student/login');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading your dashboard...</p>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Button onClick={handleLogout}>Return to Login</Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome, {student.full_name}!
            </h1>
            <p className="text-slate-600">
              Your personalized internship dashboard
            </p>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Profile Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">

              <div>
                <p className="text-sm text-slate-600">Full Name</p>
                <p className="text-lg font-semibold">{student.full_name}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="text-lg font-semibold">{student.email}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Program</p>
                <p className="text-lg font-semibold">{student.program}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Duration</p>
                <p className="text-lg font-semibold">{student.duration}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">
                    {student.status}
                  </span>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Progress Tracking
            </CardTitle>
          </CardHeader>

          <CardContent>

            <div className="flex justify-between mb-2">
              <span>Overall Progress</span>
              <span className="text-2xl font-bold text-blue-600">
                {student.progress}%
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full"
                style={{ width: `${student.progress}%` }}
              />
            </div>

            <p className="text-sm text-slate-600 mt-4">
              Keep progressing through your internship program.
            </p>

          </CardContent>
        </Card>

      </div>
    </main>
  );
}