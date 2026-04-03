'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function WebinarsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    instructor: '',
    capacity: '50',
    description: '',
  });
  const [webinars, setWebinars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch existing webinars from Supabase on load
  useEffect(() => {
    fetchWebinars();
  }, []);

  const fetchWebinars = async () => {
    try {
      const res = await fetch('/api/admin-dashboard/webinars', {
        headers: { Authorization: 'Bearer admin_token' },
      });
      const data = await res.json();
      if (data.success) setWebinars(data.data);
    } catch (err) {
      console.error('Error fetching webinars:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newWebinar = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        instructor: formData.instructor,
        capacity: parseInt(formData.capacity),
        registrations: 0,
        description: formData.description,
      };

      const res = await fetch('/api/admin-dashboard/webinars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin_token',
        },
        body: JSON.stringify(newWebinar),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        fetchWebinars(); // Refresh list
        setTimeout(() => router.push('/admin/dashboard'), 2000);
      } else {
        console.error('Failed to create webinar:', data.message);
      }
    } catch (err) {
      console.error('Error creating webinar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Webinar</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-green-600">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">Webinar Created Successfully!</h3>
                <p className="text-slate-600">Redirecting to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Webinar Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Introduction to IoT Solutions"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instructor">Instructor Name *</Label>
                    <Input
                      id="instructor"
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleChange}
                      placeholder="e.g., Dr. John Doe"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Webinar'}
                  </Button>
                  <Link href="/admin/dashboard" className="flex-1">
                    <Button variant="outline" className="w-full">Cancel</Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Display existing webinars */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Existing Webinars</h2>
          {webinars.length === 0 ? (
            <p className="text-slate-600">No webinars found.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {webinars.map(webinar => (
                <Card key={webinar.id}>
                  <CardHeader>
                    <CardTitle>{webinar.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Instructor:</strong> {webinar.instructor}</p>
                    <p><strong>Date:</strong> {webinar.date} at {webinar.time}</p>
                    <p><strong>Capacity:</strong> {webinar.capacity}</p>
                    <p>{webinar.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}