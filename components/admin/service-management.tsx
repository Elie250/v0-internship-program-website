'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

export default function ServiceManagement() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    category: '',
    image: null as File | null,
    is_published: false,
  });

  const handleAddService = async () => {
    if (!newService.title || !newService.description) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      
      let imageUrl = null;
      if (newService.image) {
        const fileName = `service-${Date.now()}-${newService.image.name}`;
        const { error: uploadError } = await supabase.storage
          .from('services')
          .upload(fileName, newService.image);

        if (!uploadError) {
          const { data } = supabase.storage.from('services').getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        }
      }

      const { data, error } = await supabase.from('services').insert([
        {
          title: newService.title,
          description: newService.description,
          category: newService.category,
          image_url: imageUrl,
          is_published: newService.is_published,
        },
      ]).select();

      if (!error) {
        setNewService({ title: '', description: '', category: '', image: null, is_published: false });
        // Reload services
        loadServices();
      }
    } catch (error) {
      console.error('Error adding service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false });
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const togglePublish = async (id: string, isPublished: boolean) => {
    try {
      const supabase = createClient();
      await supabase.from('services').update({ is_published: !isPublished }).eq('id', id);
      loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      const supabase = createClient();
      await supabase.from('services').delete().eq('id', id);
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Service Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="text"
            placeholder="Service Title"
            value={newService.title}
            onChange={(e) => setNewService({ ...newService, title: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md"
          />
          <textarea
            placeholder="Description"
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md h-24"
          />
          <input
            type="text"
            placeholder="Category"
            value={newService.category}
            onChange={(e) => setNewService({ ...newService, category: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewService({ ...newService, image: e.target.files?.[0] || null })}
            className="w-full px-3 py-2 border border-border rounded-md"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="publish"
              checked={newService.is_published}
              onChange={(e) => setNewService({ ...newService, is_published: e.target.checked })}
            />
            <label htmlFor="publish" className="text-sm">Publish immediately</label>
          </div>
          <Button onClick={handleAddService} disabled={isLoading} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.length === 0 ? (
              <p className="text-muted-foreground">No services created yet.</p>
            ) : (
              services.map((service) => (
                <div key={service.id} className="border border-border rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{service.title}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Category: {service.category || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublish(service.id, service.is_published)}
                    >
                      {service.is_published ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteService(service.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
