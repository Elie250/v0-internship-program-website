'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Zap } from 'lucide-react';

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  created_at: string;
}

export default function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services?published=true');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        setServices(data || []);
      } catch (err) {
        setError('Failed to load services');
        console.error('[v0] Error fetching services:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-lg font-semibold text-secondary mb-2">Engineering sustainable solutions</p>
            <h2 className="text-4xl font-bold text-primary mb-4">Our Engineering Services</h2>
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        </div>
      </section>
    );
  }

  // If no services from database, show the static programs
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/30 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-lg font-semibold text-secondary mb-2">Engineering sustainable solutions</p>
          <h2 className="text-4xl font-bold text-primary mb-4">Our Engineering Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Professional services designed for real-world engineering challenges.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {service.image_url && (
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  <Image
                    src={service.image_url}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                    <p className="text-xs text-secondary mt-1">{service.category}</p>
                  </div>
                  <Zap className="w-5 h-5 text-secondary flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
