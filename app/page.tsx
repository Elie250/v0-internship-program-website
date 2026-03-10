
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

const PROGRAMS = [
  {
    id: 'ELT',
    label: 'Electrical Technology (ELT)',
    image: '/images/program-elt.jpg',
    description: 'Master domestic electricity, industrial control systems, and PLC automation.'
  },
  {
    id: 'CSA',
    label: 'Computer System and Architecture (CSA)',
    image: '/images/program-csa.jpg',
    description: 'Embedded systems design and IoT microcontroller programming.'
  },
  {
    id: 'NIT',
    label: 'Networking and Internet Technology (NIT)',
    image: '/images/program-nit.jpg',
    description: 'IoT networking, device communication, and network infrastructure.'
  },
  {
    id: 'ETE',
    label: 'Electronics and Telecommunication Technology (ETE)',
    image: '/images/program-ete.jpg',
    description: 'Electronic sensors, components, and telecommunications systems.'
  },
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

          <Image
            src="/hero-electrical.jpg"
            alt="Industrial electrical panels"
            fill
            className="object-cover"
            priority
          />

          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-slate-900/70 to-black/80"></div>

        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">

          <div className="text-center max-w-4xl space-y-8">

            <div className="inline-block bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-blue-400/30">
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
                <Button size="lg" className="text-base px-8 h-12 bg-blue-600 hover:bg-blue-700">
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
                  variant="outline"
                  className="flex items-center gap-2 text-base px-8 h-12 bg-white/10 border-white/30 text-white hover:bg-white/20"
                >

                  <MessageCircle size={18} />
                  Chat on WhatsApp

                </Button>

              </a>

            </div>

          </div>

        </div>

      </section>

      {/* Contact & Footer */}

      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white px-4 py-20">

        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16">

            <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>

            <p className="text-lg text-white/90">
              Have questions? We're here to help you start your learning journey.
            </p>

          </div>

          <div className="grid sm:grid-cols-3 gap-8">

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center hover:bg-white/20 transition-colors">

              <Phone className="mx-auto h-10 w-10 mb-4" />
              <h3 className="font-semibold mb-2">Phone</h3>

              <a
                href="tel:+250783986252"
                className="text-white/80 hover:text-white transition-colors"
              >
                +250 783 986 252
              </a>

            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center hover:bg-white/20 transition-colors">

              <Mail className="mx-auto h-10 w-10 mb-4" />
              <h3 className="font-semibold mb-2">Email</h3>

              <a
                href="mailto:energylogicsltd@gmail.com"
                className="text-white/80 hover:text-white transition-colors break-all"
              >
                energylogicsltd@gmail.com
              </a>

            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center hover:bg-white/20 transition-colors">

              <MapPin className="mx-auto h-10 w-10 mb-4" />
              <h3 className="font-semibold mb-2">Location</h3>

              <p className="text-white/80">Nyamirambo, Kigali, Rwanda</p>

            </div>

          </div>

          <div className="border-t border-white/20 mt-16 pt-8 text-center">

            <p className="text-white/70 mb-4">
              © 2024 Energy & Logics. All rights reserved.
            </p>

            <p className="text-white/60 text-sm">
              Engineering Sustainable Solutions • Building Tomorrow's Innovators
            </p>

          </div>

        </div>

      </section>

    </main>

  );

}
