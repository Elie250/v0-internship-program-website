'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { submitRegistration } from '@/app/actions/register';

const PROGRAMS = [
  { id: 'ELT', label: 'Electrical Technology (ELT)', description: 'Domestic electricity, Industrial control systems, PLC basics' },
  { id: 'CSA', label: 'Computer System and Architecture (CSA)', description: 'Embedded systems and IoT' },
  { id: 'NIT', label: 'Networking and Internet Technology (NIT)', description: 'IoT networking and device communication' },
  { id: 'ETE', label: 'Electronics and Telecommunication Technology (ETE)', description: 'Sensors, electronics and embedded systems' },
];

const FEES = [
  { level: 'Level 5', price: '30,000 RWF' },
  { level: 'Level 4', price: '30,000 RWF' },
  { level: 'Level 3 (2 weeks)', price: '20,000 RWF' },
];

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    school: '',
    program: '',
    level: '',
    duration: '',
    message: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitRegistration(formData);
      setIsSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        school: '',
        program: '',
        level: '',
        duration: '',
        message: '',
      });
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting registration:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">Energy & Logics</div>
            <Link href="/admin">
              <Button variant="ghost" size="sm">Admin</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-background/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight text-primary sm:text-6xl">
              Electrical & Automation Internship Program
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Gain practical skills in Electrical, Automation, Embedded Systems and IoT
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Nyamirambo, Kigali, Rwanda</span>
            </div>
            <div className="mt-8">
              <a href="#form" className="inline-block">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Register Now
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-balance text-center text-3xl font-bold">Programs Offered</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {PROGRAMS.map((program) => (
              <Card key={program.id} className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-primary">{program.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {program.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Fees Section */}
      <section className="border-t border-border bg-muted/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-balance text-center text-3xl font-bold">Internship Fees</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {FEES.map((fee) => (
              <Card key={fee.level} className="border-border bg-card text-center">
                <CardHeader>
                  <CardTitle className="text-lg">{fee.level}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{fee.price}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section id="form" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-balance text-center text-3xl font-bold">Join Our Program</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Fill out the form below to register for the internship program
          </p>

          <Card className="mt-8 border-border">
            <CardHeader>
              <CardTitle>Registration Form</CardTitle>
            </CardHeader>
            <CardContent>
              {isSuccess && (
                <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-900 border border-green-200">
                  <p className="font-semibold">Success!</p>
                  <p>Your registration has been received. We will contact you soon.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+250 78X XXX XXX"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="school">School Name *</Label>
                  <Input
                    id="school"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    placeholder="Your school or university"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="program">Program *</Label>
                    <Select value={formData.program} onValueChange={(value) => handleSelectChange('program', value)}>
                      <SelectTrigger id="program" className="mt-1">
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAMS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="level">Level *</Label>
                    <Select value={formData.level} onValueChange={(value) => handleSelectChange('level', value)}>
                      <SelectTrigger id="level" className="mt-1">
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Level 3</SelectItem>
                        <SelectItem value="4">Level 4</SelectItem>
                        <SelectItem value="5">Level 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Internship Duration *</Label>
                  <Input
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 2 weeks, 1 month, 3 months"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself or any specific interests (optional)"
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Register Now'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="border-t border-border bg-muted/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-balance text-center text-3xl font-bold">Get in Touch</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <Phone className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">Phone / WhatsApp</h3>
              <p className="mt-2 text-sm text-muted-foreground">+250 783 986 252</p>
            </div>
            <div className="text-center">
              <Mail className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">Email</h3>
              <p className="mt-2 text-sm text-muted-foreground">energylogicsltd@gmail.com</p>
            </div>
            <div className="text-center">
              <MapPin className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">Location</h3>
              <p className="mt-2 text-sm text-muted-foreground">Nyamirambo, Kigali, Rwanda</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Energy and Logics Ltd. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
