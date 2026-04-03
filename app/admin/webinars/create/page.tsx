'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, LogOut, PlusCircle } from 'lucide-react';

interface Webinar {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  capacity: number;
  registrations: number;
  description: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

export default function AdminWebinarsPage() {
  const router = useRouter();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [filtered, setFiltered] = useState<Webinar[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Omit<Webinar, 'id' | 'registrations'>>({
    title: '',
    instructor: '',
    date: '',
    time: '',
    capacity: 50,
    description: '',
    status: 'Upcoming',
  });

  // Fetch webinars
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (!adminAuth) router.push('/admin/login');

    const fetchWebinars = async () => {
      try {
        const res = await fetch('/api/admin-dashboard/webinars');
        const data = await res.json();
        if (data.success) {
          setWebinars(data.data);
          setFiltered(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWebinars();
  }, [router]);

  // Search filter
  useEffect(() => {
    let temp = webinars;
    if (searchTerm) temp = temp.filter(w =>
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFiltered(temp);
  }, [searchTerm, webinars]);

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/admin/login');
  };

  const handleEdit = (webinar: Webinar) => {
    setSelectedWebinar(webinar);
    setFormData({
      title: webinar.title,
      instructor: webinar.instructor,
      date: webinar.date,
      time: webinar.time,
      capacity: webinar.capacity,
      description: webinar.description,
      status: webinar.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webinar?')) return;
    try {
      const res = await fetch('/api/admin-dashboard/webinars', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) setWebinars(webinars.filter(w => w.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      const method = selectedWebinar ? 'PATCH' : 'POST';
      const body = selectedWebinar
        ? { ...formData, id: selectedWebinar.id }
        : formData;
      const res = await fetch('/api/admin-dashboard/webinars', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        if (selectedWebinar) {
          setWebinars(webinars.map(w => w.id === data.data.id ? data.data : w));
        } else {
          setWebinars([...webinars, data.data]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setShowModal(false);
      setSelectedWebinar(null);
      setFormData({
        title: '',
        instructor: '',
        date: '',
        time: '',
        capacity: 50,
        description: '',
        status: 'Upcoming',
      });
    }
  };

  const statusColor = (status: Webinar['status']) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-100 text-blue-800';
      case 'Ongoing': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) return <p className="text-center py-10">Loading webinars...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-4xl font-bold">Webinars Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
          <Button variant="default" onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Add Webinar
          </Button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by title or instructor..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      {/* Webinars Table */}
      <Card className="shadow-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th>Instructor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Capacity</th>
              <th>Registrations</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(webinar => (
              <tr key={webinar.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-2">{webinar.title}</td>
                <td>{webinar.instructor}</td>
                <td>{webinar.date}</td>
                <td>{webinar.time}</td>
                <td>{webinar.capacity}</td>
                <td>{webinar.registrations}</td>
                <td>
                  <Badge className={`px-2 py-1 rounded-full text-xs ${statusColor(webinar.status)}`}>
                    {webinar.status}
                  </Badge>
                </td>
                <td className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(webinar)}>
                    <Edit className="w-4 h-4" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(webinar.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full shadow-xl">
            <CardHeader>
              <CardTitle>{selectedWebinar ? 'Edit Webinar' : 'Add New Webinar'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              <Input
                placeholder="Instructor"
                value={formData.instructor}
                onChange={e => setFormData({ ...formData, instructor: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
                <Input
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <Input
                type="number"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
              />
              <Input
                placeholder="Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as Webinar['status'] })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setSelectedWebinar(null) }}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
                  {selectedWebinar ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}