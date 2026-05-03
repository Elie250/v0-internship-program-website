'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Star } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  is_featured: boolean;
  created_at: string;
}

export default function AnnouncementManagementTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image_url: '',
    is_featured: false,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('announcements').insert([formData]).select();

      if (error) throw error;
      
      setAnnouncements([...announcements, data[0]]);
      setFormData({ title: '', message: '', image_url: '', is_featured: false });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create announcement:', error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      
      if (error) throw error;
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('announcements').update({ is_featured: !currentStatus }).eq('id', id);
      
      if (error) throw error;
      setAnnouncements(announcements.map(a => a.id === id ? { ...a, is_featured: !currentStatus } : a));
    } catch (error) {
      console.error('Failed to update announcement:', error);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading announcements...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Announcements</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
              <DialogDescription>Share news and updates with users</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Announcement Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., New Course Launched"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Announcement content"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="mt-2"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="featured" className="m-0">Feature on homepage</Label>
              </div>
              <Button onClick={handleCreateAnnouncement} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Create Announcement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No announcements yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-lg transition border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{announcement.title}</h4>
                      {announcement.is_featured && (
                        <Star className="w-4 h-4 text-accent fill-accent" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {announcement.is_featured && (
                    <Badge className="bg-accent/10 text-accent border-accent/20">Featured</Badge>
                  )}
                </div>
                <p className="text-sm text-foreground mb-4">{announcement.message}</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleFeatured(announcement.id, announcement.is_featured)}
                  >
                    {announcement.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
