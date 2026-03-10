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
import { submitRegistration } from '@/app/actions/register';

const PROGRAMS = [
  { id: 'ELT', label: 'Electrical Technology (ELT)', description: 'Domestic electricity, Industrial control systems, PLC basics' },
  { id: 'CSA', label: 'Computer System and Architecture (CSA)', description: 'Embedded systems and IoT' },
  { id: 'NIT', label: 'Networking and Internet Technology (NIT)', description: 'IoT networking and device communication' },
  { id: 'ETE', label: 'Electronics and Telecommunication Technology (ETE)', description: 'Sensors, electronics and embedded systems' },
];

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    registrationType: 'Student', // Student or Individual
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
      await submitRegistration(formData);
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
      <section className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/hero-electrical.jpg" alt="Industrial electrical panels" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
          <div className="text-center max-w-4xl">
            <h1 className="text-5xl font-bold text-white">
              Electrical & Automation Internship Program
            </h1>
            <p className="mt-6 text-xl text-white/90">
              Practical training in Electrical Systems, PLC Automation, Embedded Systems and IoT
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-lg text-white">
              <MapPin className="h-5 w-5" /> Nyamirambo, Kigali, Rwanda
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a href="#registration-form">
                <Button size="lg">Register Now</Button>
              </a>
              <a href="https://wa.me/250783986252?text=Hello%20I%20am%20interested%20in%20your%20training%20program" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="flex items-center gap-2">
                  <MessageCircle size={18} /> Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center">Student Internship Programs</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((program) => (
              <Card key={program.id}>
                <CardHeader>
                  <CardTitle>{program.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{program.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="registration-form" className="px-4 py-16 bg-muted/10">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-bold text-center">Register for Training</h2>

          {successMessage && (
            <div className="mb-6 bg-green-100 p-4 rounded text-center text-green-800">
              {successMessage}
            </div>
          )}

          <Card className="mt-10">
            <CardHeader>
              <CardTitle>Registration Form</CardTitle>
            </CardHeader>
            <CardContent>

              {/* Registration Type Toggle */}
              <div className="flex justify-center gap-4 mb-6">
                <Button variant={formData.registrationType === 'Student' ? 'default' : 'outline'} onClick={() => handleRegistrationTypeChange('Student')}>Student</Button>
                <Button variant={formData.registrationType === 'Individual' ? 'default' : 'outline'} onClick={() => handleRegistrationTypeChange('Individual')}>Individual</Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                  <Label>Full Name</Label>
                  <Input name="fullName" value={formData.fullName} onChange={handleInputChange} required />
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

                {/* Student Fields */}
                {formData.registrationType === 'Student' && (
                  <>
                    <div>
                      <Label>School</Label>
                      <Input name="school" value={formData.school} onChange={handleInputChange} required />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Program</Label>
                        <Select value={formData.program} onValueChange={(v) => handleSelectChange('program', v)}>
                          <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                          <SelectContent>
                            {PROGRAMS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Level</Label>
                        <Select value={formData.level} onValueChange={(v) => handleSelectChange('level', v)}>
                          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">Level 3</SelectItem>
                            <SelectItem value="4">Level 4</SelectItem>
                            <SelectItem value="5">Level 5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Duration</Label>
                      <Input name="duration" value={formData.duration} onChange={handleInputChange} required />
                    </div>
                  </>
                )}

                {/* Individual Fields */}
                {formData.registrationType === 'Individual' && (
                  <>
                    <div>
                      <Label>Profession</Label>
                      <Input name="profession" value={formData.profession} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <Label>Training Program</Label>
                      <Input name="trainingProgram" value={formData.trainingProgram} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <Label>Schedule</Label>
                      <Input name="schedule" value={formData.schedule} onChange={handleInputChange} required />
                    </div>
                  </>
                )}

                <div>
                  <Label>Message</Label>
                  <Textarea name="message" value={formData.message} onChange={handleInputChange} />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-primary text-white px-4 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold">Get in Touch</h2>
          <div className="grid sm:grid-cols-3 gap-8 mt-12">
            <div>
              <Phone className="mx-auto h-8 w-8" />
              <p className="mt-2">+250 783 986 252</p>
            </div>
            <div>
              <Mail className="mx-auto h-8 w-8" />
              <p className="mt-2">energylogicsltd@gmail.com</p>
            </div>
            <div>
              <MapPin className="mx-auto h-8 w-8" />
              <p className="mt-2">Nyamirambo, Kigali</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}