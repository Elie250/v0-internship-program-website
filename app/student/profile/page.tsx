'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User } from 'lucide-react';

interface StudentProfile {
  name: string;
  email: string;
  phone: string;
  program: string;
  dateOfBirth?: string;
  province?: string;
  district?: string;
  school?: string;
  fieldOfStudy?: string;
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentEmail = localStorage.getItem('student_email');
    if (!studentEmail) {
      window.location.href = '/student/login';
      return;
    }

    // Mock profile data - in production this would come from your API
    setProfile({
      name: 'Student Name',
      email: studentEmail,
      phone: '+250 7XX XXX XXX',
      program: 'Electrical Technology',
      dateOfBirth: 'January 1, 2000',
      province: 'Kigali City',
      district: 'Nyamirambo',
      school: 'Your School',
      fieldOfStudy: 'Electronics'
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Link href="/student/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Your Profile</h1>
        <Link href="/student/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-semibold">{profile.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold">{profile.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-semibold">{profile.dateOfBirth || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Province</p>
              <p className="font-semibold">{profile.province || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">District</p>
              <p className="font-semibold">{profile.district || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Information */}
      <Card>
        <CardHeader>
          <CardTitle>Program Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Selected Program</p>
              <p className="font-semibold">{profile.program}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">School/University</p>
              <p className="font-semibold">{profile.school || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Field of Study</p>
              <p className="font-semibold">{profile.fieldOfStudy || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline">Edit Profile</Button>
        <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
          Change Password
        </Button>
      </div>
    </div>
  );
}
