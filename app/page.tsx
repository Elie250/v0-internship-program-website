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
              <div className="text-lg font-bold text-primary">Energy & Logics</div>
              <div className="text-xs text-muted-foreground">Engineering Sustainable Solutions</div>
            </div>
          </div>
          <Link href="/admin/login">
            <Button variant="outline" size="sm">Admin</Button>
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

            <div className="inline-block bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-primary/30">
              Transform Your Engineering Career
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight">
              Master Modern <br />Engineering Technologies
            </h1>

            <p className="mt-6 text-xl text-white/90 max-w-2xl mx-auto">
              Comprehensive internship programs in Electrical Systems, PLC Automation,
              Embedded Systems, IoT, and Telecommunications.
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-lg text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-6 py-3 w-fit mx-auto">
              <MapPin className="h-5 w-5" />
              <span>Nyamirambo, Kigali, Rwanda</span>
            </div>

            <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">

              <a href="#registration-form">
                <Button
                  size="lg"
                  className="text-base px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                  Start Your Journey
                </Button>
              </a>

              <a
                href="https://wa.me/250783986252?text=Hello%20I%20am%20interested%20in%20your%20training%20program"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="flex items-center gap-2 text-base px-8 h-12 bg-green-500 hover:bg-green-600 text-white shadow-md"
                >
                  <MessageCircle size={18} />
                  Chat on WhatsApp
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
              Choose from our comprehensive training programs.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">

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
                  <CardDescription className="text-base mt-2">
                    {program.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <a href="#registration-form">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      Enroll Now
                    </Button>
                  </a>
                </CardContent>

              </Card>
            ))}

          </div>
        </div>
      </section>

      {/* Registration */}
      <section id="registration-form" className="px-4 py-20">
        <div className="mx-auto max-w-3xl">

          {successMessage && (
            <div className="mb-6 bg-green-100 p-4 rounded text-center text-green-800">
              {successMessage}
            </div>
          )}

          <Card>

            <CardHeader>
              <CardTitle>Registration Form</CardTitle>
            </CardHeader>

            <CardContent>

              <div className="flex justify-center gap-4 mb-6">

                <Button
                  className={
                    formData.registrationType === 'Student'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                  }
                  onClick={() => handleRegistrationTypeChange('Student')}
                >
                  Student
                </Button>

                <Button
                  className={
                    formData.registrationType === 'Individual'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                  }
                  onClick={() => handleRegistrationTypeChange('Individual')}
                >
                  Individual
                </Button>

              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <Label>Email</Label>
                    <Input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input name="phone" value={formData.phone} onChange={handleInputChange} required />
                  </div>

                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea name="message" value={formData.message} onChange={handleInputChange} />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>
      </section>

    </main>
  );
}