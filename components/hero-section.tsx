'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface Announcement {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  is_featured: boolean;
}

export function HeroSection() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedAnnouncement = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        setAnnouncement(data);
      } catch (error) {
        console.error('Failed to fetch announcement:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedAnnouncement();
  }, []);

  if (isLoading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background overflow-hidden">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-6 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background overflow-hidden pt-20 md:pt-0">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-tight text-balance">
                Master Engineering Excellence
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl text-pretty">
                {announcement?.title || 'Join our comprehensive internship programs'}
              </p>
            </div>

            {announcement?.message && (
              <p className="text-base text-foreground/80 max-w-xl leading-relaxed">
                {announcement.message}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth/login">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  Login to Account
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative h-96 md:h-full min-h-96 rounded-lg overflow-hidden shadow-2xl">
            {announcement?.image_url ? (
              <Image
                src={announcement.image_url}
                alt={announcement.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">Featured announcement image</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 py-12 border-t border-border">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">500+</p>
            <p className="text-sm text-muted-foreground mt-1">Students Trained</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">20+</p>
            <p className="text-sm text-muted-foreground mt-1">Courses Offered</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">95%</p>
            <p className="text-sm text-muted-foreground mt-1">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">100%</p>
            <p className="text-sm text-muted-foreground mt-1">Placement Help</p>
          </div>
        </div>
      </div>
    </section>
  );
}
