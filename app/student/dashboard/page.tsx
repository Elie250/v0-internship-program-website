'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Award, DollarSign, Bell, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface StudentRegistration {
  id: string;
  name: string;
  email: string;
  program: string;
  duration: string;
  registration_status: string;
  created_at: string;
}

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState<StudentRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const studentEmail = localStorage.getItem('student_email');
    if (!studentEmail) {
      window.location.href = '/student/login';
      return;
    }

    // Fetch student data
    const fetchStudentData = async () => {
      try {
        // For now, we'll use the email from localStorage to identify the student
        // In a real app, you'd fetch from your API
        const mockData: StudentRegistration = {
          id: '1',
          name: 'Student Name',
          email: studentEmail,
          program: 'Electrical Technology',
          duration: '6 months',
          registration_status: 'Pending',
          created_at: new Date().toISOString()
        };
        setStudentData(mockData);
      } catch (err) {
        setError('Failed to load student data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-destructive/50 max-w-sm w-full">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error || 'Failed to load data'}</p>
            <Link href="/">
              <Button variant="outline" className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'Rejected':
        return <AlertCircle className="h-5 w-5" />;
      case 'Pending':
        return <Clock className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome back, {studentData.name.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Here's your application status and next steps</p>
      </div>

      {/* Status Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Application Status</span>
            <Badge className={`${getStatusColor(studentData.registration_status)} flex items-center gap-2`}>
              {getStatusIcon(studentData.registration_status)}
              {studentData.registration_status}
            </Badge>
          </CardTitle>
          <CardDescription>Program: {studentData.program}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-semibold">{studentData.duration}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Application Date</p>
              <p className="font-semibold">{new Date(studentData.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/student/profile">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View and edit your profile</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/student/documents">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Upload and manage files</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/student/announcements">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Latest updates and news</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/student/certificates">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Your certifications</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside">
            {studentData.registration_status === 'Pending' && (
              <>
                <li className="text-muted-foreground">Wait for application review (2-3 business days)</li>
                <li className="text-muted-foreground">You'll receive an email with interview details</li>
                <li className="text-muted-foreground">Prepare for your interview</li>
              </>
            )}
            {studentData.registration_status === 'Accepted' && (
              <>
                <li className="text-muted-foreground">Congratulations! You've been accepted!</li>
                <li className="text-muted-foreground">Complete your enrollment by paying the registration fee</li>
                <li className="text-muted-foreground">Start date will be communicated soon</li>
              </>
            )}
            {studentData.registration_status === 'Rejected' && (
              <>
                <li className="text-muted-foreground">Your application was not accepted at this time</li>
                <li className="text-muted-foreground">You can apply again next semester</li>
                <li className="text-muted-foreground">Contact us for feedback</li>
              </>
            )}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
