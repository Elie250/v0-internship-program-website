'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, Clock, CheckCircle, AlertCircle, User, FileText } from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  email: string;
  program: string;
  duration: string;
  startDate: string;
  status: string;
  progress: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('student_auth_token');
    const studentId = localStorage.getItem('student_id');
    const studentName = localStorage.getItem('student_name');

    if (!token || !studentId) {
      router.push('/student/login');
      return;
    }

    // Simulate fetching student data - in production, this would call an API
    setStudent({
      id: studentId,
      name: studentName || 'Student',
      email: localStorage.getItem('student_email') || '',
      program: 'Embedded Systems Internship',
      duration: '6 months',
      startDate: new Date().toLocaleDateString(),
      status: 'Active',
      progress: 65,
    });

    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('student_auth_token');
    localStorage.removeItem('student_id');
    localStorage.removeItem('student_name');
    router.push('/');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-600 mb-4">Failed to load your profile</p>
          <Button onClick={handleLogout}>Return to Login</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome, {student.name}!</h1>
            <p className="text-slate-600">Your personalized internship dashboard</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600">Full Name</p>
                <p className="text-lg font-semibold">{student.name}</p>
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
                <p className="text-sm text-slate-600">Start Date</p>
                <p className="text-lg font-semibold">{student.startDate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">{student.status}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Progress Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Overall Progress</span>
                  <span className="text-2xl font-bold text-blue-600">{student.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${student.progress}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-4">
                You&apos;re doing great! Keep up the excellent work on your internship.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow hover:shadow-lg transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-amber-600" />
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600 mb-4">156</p>
              <p className="text-sm text-slate-600 mb-4">hours logged</p>
              <Button className="w-full bg-amber-600 hover:bg-amber-700">Log Hours</Button>
            </CardContent>
          </Card>

          <Card className="shadow hover:shadow-lg transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-green-600" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 mb-4">3</p>
              <p className="text-sm text-slate-600 mb-4">active assignments</p>
              <Button className="w-full bg-green-600 hover:bg-green-700">View All</Button>
            </CardContent>
          </Card>

          <Card className="shadow hover:shadow-lg transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600 mb-4">2</p>
              <p className="text-sm text-slate-600 mb-4">new messages</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Check Messages</Button>
            </CardContent>
          </Card>
        </div>

        {/* Resources Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Learning Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/training-programs">
                <div className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                  <h3 className="font-semibold text-blue-600 mb-2">Training Materials</h3>
                  <p className="text-sm text-slate-600">Access your course materials and videos</p>
                </div>
              </Link>
              <Link href="/webinars">
                <div className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                  <h3 className="font-semibold text-blue-600 mb-2">Upcoming Webinars</h3>
                  <p className="text-sm text-slate-600">Register for live expert-led sessions</p>
                </div>
              </Link>
              <Link href="#">
                <div className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                  <h3 className="font-semibold text-blue-600 mb-2">Performance Reports</h3>
                  <p className="text-sm text-slate-600">View your progress and feedback</p>
                </div>
              </Link>
              <Link href="#">
                <div className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                  <h3 className="font-semibold text-blue-600 mb-2">Support & Help</h3>
                  <p className="text-sm text-slate-600">Contact your mentor or administration</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
