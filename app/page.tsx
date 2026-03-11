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
  { id: 'ELT', label: 'Electrical Technology (ELT)', description: 'Master domestic electricity, industrial control systems, and PLC automation.' },
  { id: 'CSA', label: 'Computer System and Architecture (CSA)', description: 'Embedded systems design and IoT microcontroller programming.' },
  { id: 'NIT', label: 'Networking and Internet Technology (NIT)', description: 'IoT networking, device communication, and network infrastructure.' },
  { id: 'ETE', label: 'Electronics and Telecommunication Technology (ETE)', description: 'Electronic sensors, components, and telecommunications systems.' },
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegistrationTypeChange = (type: 'Student' | 'Individual') => {
    setFormData(prev => ({ ...prev, registrationType: type }));
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
      console.error(error);
      alert('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Energy & Logics" width={40} height={40} />
            <div>
              <div className="text-lg font-bold text-green-600">Energy & Logics</div>
              <div className="text-xs text-gray-500">Engineering Sustainable Solutions</div>
            </div>
          </div>
          <Link href="/admin/login">
            <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
              Admin
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen w-full overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="bg-gradient-to-b from-black/70 via-black/60 to-black/70 w-full h-full"></div>
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
                <Button size="lg" className="text-white bg-green-600 hover:bg-green-700 px-8 h-12">
                  Start Your Journey
                </Button>
              </a>
              <a href="https://wa.me/250783986252" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="flex items-center gap-2 text-white border-white hover:bg-green-700 px-8 h-12">
                  <MessageCircle size={18} /> Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="px-4 py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Internship Programs</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Choose from our comprehensive training programs designed to build your skills in modern engineering technologies.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {PROGRAMS.map(program => (
              <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-xl">{program.label}</CardTitle>
                  <CardDescription className="text-base mt-2">{program.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="registration-form" className="px-4 py-20 bg-gradient-to-b from-gray-100 to-white relative z-10">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Start Your Learning Journey</h2>
            <p className="text-lg text-gray-600">
              Join our community of engineers and technology professionals. Register today and begin your transformation.
            </p>
          </div>

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
              <div className="flex justify-center gap-4 mb-6">
                <Button variant={formData.registrationType === 'Student' ? 'default' : 'outline'} onClick={() => handleRegistrationTypeChange('Student')} className="bg-green-600 hover:bg-green-700 text-white">
                  Student
                </Button>
                <Button variant={formData.registrationType === 'Individual' ? 'default' : 'outline'} onClick={() => handleRegistrationTypeChange('Individual')} className="bg-green-600 hover:bg-green-700 text-white">
                  Individual
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} className="bg-white text-black border border-gray-300" required />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} className="bg-white text-black border border-gray-300" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="bg-white text-black border border-gray-300" required />
                  </div>
                </div>

                {/* Student Fields */}
                {formData.registrationType === 'Student' && (
                  <>
                    <div>
                      <Label htmlFor="school">School</Label>
                      <Input id="school" name="school" value={formData.school} onChange={handleInputChange} className="bg-white text-black border border-gray-300" required />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Program</Label>
                        <Select value={formData.program} onValueChange={v => handleSelectChange('program', v)}>
                          <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                          <SelectContent>
                            {PROGRAMS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Level</Label>
                        <Select value={formData.level} onValueChange={v => handleSelectChange('level', v)}>
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
                      <Label htmlFor="duration">Duration</Label>
                      <Input id="duration" name="duration" value={formData.duration} onChange={handleInputChange} className="bg-white text-black border border-gray-300" required />
                    </div>
                  </>
                )}

                {/* Individual Fields */}
                {formData.registrationType === 'Individual' && (
                  <>
                    <div>
                      <Label htmlFor="profession">Profession</Label>
                      <Input id="profession" name="profession" value={formData.profession} onChange={handleInputChange} className="bg-white text-black border border-gray-300" required />
                    </div>
                    <div>
                      <Label htmlFor="trainingProgram">Training Program</Label>
                      <Input id="trainingProgram" name="trainingProgram" value={formData.trainingProgram} onChange={handleInputChange} className="bg-white text-black border border-gray-300" required />
                    </div>
                    <div>
                      <Label htmlFor="schedule">Schedule</Label>
                      <Input id="schedule" name="schedule" value={formData.schedule} onChange={handleInputChange} className="bg-white text-black border border-gray-300" required />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" name="message" value={formData.message} onChange={handleInputChange} className="bg-white text-black border border-gray-300" />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact & Footer */}
      <section className="bg-gradient-to-br from-green-600 to-green-700 text-white px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-lg text-white/90">Have questions? We're here to help you start your learning journey.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center hover:bg-white/15 transition-colors">
              <Phone className="mx-auto h-10 w-10 mb-4" />
              <h3 className="font-semibold mb-2">Phone</h3>
              <a href="tel:+250783986252" className="text-white/80 hover:text-white transition-colors">+250 783 986 252</a>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center hover:bg-white/15 transition-colors">
              <Mail className="mx-auto h-10 w-10 mb-4" />
              <h3 className="font-semibold mb-2">Email</h3>
              <a href="mailto:energylogicsltd@gmail.com" className="text-white/80 hover:text-white transition-colors break-all">energylogicsltd@gmail.com</a>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center hover:bg-white/15 transition-colors">
              <MapPin className="mx-auto h-10 w-10 mb-4" />
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-white/80">Nyamirambo, Kigali, Rwanda</p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-16 pt-8 text-center">
            <p className="text-white/70 mb-4">&copy; 2024 Energy & Logics. All rights reserved.</p>
            <p className="text-white/60 text-sm">Engineering Sustainable Solutions • Building Tomorrow's Innovators</p>
          </div>
        </div>
      </section>
    </main>
  );
}