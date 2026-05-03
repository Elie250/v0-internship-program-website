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
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  program: string;
  duration: string;
  is_published: boolean;
  created_at: string;
}

export default function CourseManagementTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    program: '',
    duration: '',
    is_published: false,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('courses').insert([formData]).select();

      if (error) throw error;
      
      setCourses([...courses, data[0]]);
      setFormData({ title: '', description: '', program: '', duration: '', is_published: false });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('courses').delete().eq('id', id);
      
      if (error) throw error;
      setCourses(courses.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('courses').update({ is_published: !currentStatus }).eq('id', id);
      
      if (error) throw error;
      setCourses(courses.map(c => c.id === id ? { ...c, is_published: !currentStatus } : c));
    } catch (error) {
      console.error('Failed to update course:', error);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading courses...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Courses</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>Add a new course to the academy</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Advanced Electrical Systems"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Course overview and objectives"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program">Program</Label>
                  <Input
                    id="program"
                    placeholder="e.g., Electrical Engineering"
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 6 weeks"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="published" className="m-0">Publish immediately</Label>
              </div>
              <Button onClick={handleCreateCourse} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Create Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No courses created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    {course.program && (
                      <p className="text-sm text-muted-foreground mt-1">{course.program}</p>
                    )}
                  </div>
                  <Badge className={course.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{course.description}</p>
                {course.duration && (
                  <p className="text-sm"><span className="font-semibold">Duration:</span> {course.duration}</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => togglePublish(course.id, course.is_published)}
                  >
                    {course.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCourse(course.id)}
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
