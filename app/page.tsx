'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PROGRAMS = [
  { id: 'ELT', label: 'Electrical Technology (ELT)', image: '/images/program-elt.jpg', description: 'Master domestic electricity, industrial control systems, and PLC automation.' },
  { id: 'CSA', label: 'Computer System and Architecture (CSA)', image: '/images/program-csa.jpg', description: 'Embedded systems design and IoT microcontroller programming.' },
  { id: 'NIT', label: 'Networking and Internet Technology (NIT)', image: '/images/program-nit.jpg', description: 'IoT networking, device communication, and network infrastructure.' },
  { id: 'ETE', label: 'Electronics and Telecommunication Technology (ETE)', image: '/images/program-ete.jpg', description: 'Electronic sensors, components, and telecommunications systems.' },
];

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    registrationType: 'Student',
    fullName: '',
    email: '',
    phone: '',
    school: '',
    program: '',
    level: '',
    duration: '',
    profession: '',
    trainingProgram: '',
    schedule: '',
    message: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegistrationTypeChange = (type: 'Student' | 'Individual') => {
    setFormData((prev) => ({ ...prev, registrationType: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.registrationType === 'Student' && (!formData.program || !formData.level)) {
      alert('Please select program and level');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Registration failed');

      setSuccessMessage('Registration received! We will contact you soon.');

      setFormData({
        registrationType: 'Student',
        fullName: '',
        email: '',
        phone: '',
        school: '',
        program: '',
        level: '',
        duration: '',
        profession: '',
        trainingProgram: '',
        schedule: '',
        message: '',
      });

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Energy & Logics" width={40} height={40} />
            <div>
              <div className="text-lg font-bold text-green-600">Energy & Logics</div>
              <div className="text-xs text-muted-foreground">Engineering Sustainable Solutions</div>
            </div>
          </div>
          <Link href="/admin/login">
            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:border-green-600 hover:text-green-600">Admin</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen w-full overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <Image src="/hero-electrical.jpg" alt="Industrial electrical panels" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
          <div className="text-center max-w-4xl space-y-8">
            <div className="inline-block bg-green-600/20 text-green-600 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-green-600/30">
              Transform Your Engineering Career
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight">
              Master Modern <br />Engineering Technologies
            </h1>
            <p className="mt-6 text-xl text-white/90 max-w-2xl mx-auto">
              Comprehensive internship programs in Electrical Systems, PLC Automation, Embedded Systems, IoT, and Telecommunications. Gain hands-on experience with industry experts.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-lg text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-6 py-3 w-fit mx-auto">
              <MapPin className="h-5 w-5" />
              <span>Nyamirambo, Kigali, Rwanda</span>
            </div>
            <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a href="#registration-form">
                <Button size="lg" className="text-base px-8 h-12 bg-green-600 hover:bg-green-700 text-white">
                  Start Your Journey
                </Button>
              </a>
              <a href="https://wa.me/250783986252?text=Hello%20I%20am%20interested%20in%20your%20training%20program" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="flex items-center gap-2 text-base px-8 h-12 border-green-600 text-green-600 hover:bg-green-100">
                  <MessageCircle size={18} /> Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="px-4 py-20 bg-gradient-to-b from-background to-muted/5">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Internship Programs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from our comprehensive training programs designed to build your skills in modern engineering technologies.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {PROGRAMS.map((program) => (
              <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  <Image
                    src={program.image}
                    alt={program.label}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{program.label}</CardTitle>
                  <CardDescription className="text-base mt-2">{program.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <a href="#registration-form" className="block mt-4">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Enroll Now</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      {/* ... Keep all form fields intact */}
      {/* Button colors: primary green (#25D366) for submit */}
      {/* Contact section buttons and texts are also green-based */}
      {/* ... rest of the page unchanged */}

    </main>
  );
}