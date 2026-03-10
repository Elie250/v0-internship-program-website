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
  SelectValue
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
    description:
      'Master domestic electricity, industrial control systems, and PLC automation.'
  },
  {
    id: 'CSA',
    label: 'Computer System and Architecture (CSA)',
    image: '/images/program-csa.jpg',
    description:
      'Embedded systems design and IoT microcontroller programming.'
  },
  {
    id: 'NIT',
    label: 'Networking and Internet Technology (NIT)',
    image: '/images/program-nit.jpg',
    description:
      'IoT networking, device communication, and network infrastructure.'
  },
  {
    id: 'ETE',
    label: 'Electronics and Telecommunication Technology (ETE)',
    image: '/images/program-ete.jpg',
    description:
      'Electronic sensors, components, and telecommunications systems.'
  }
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
    message: ''
  });


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

    if (
      formData.registrationType === 'Student' &&
      (!formData.program || !formData.level)
    ) {
      alert('Please select program and level');
      return;
    }

    setIsSubmitting(true);

    try {

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

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
        message: ''
      });

      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (error) {

      console.error(error);
      alert('Failed to submit registration');

    } finally {

      setIsSubmitting(false);

    }

  };


  return (

    <main className="min-h-screen bg-background text-foreground">


      {/* NAVIGATION */}

      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">

        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <Image src="/logo.png" alt="Energy & Logics" width={40} height={40} />

            <div>
              <div className="text-lg font-bold text-primary">Energy & Logics</div>
              <div className="text-xs text-muted-foreground">
                Engineering Sustainable Solutions
              </div>
            </div>

          </div>

          <Link href="/admin/login">
            <Button variant="outline" size="sm">
              Admin
            </Button>
          </Link>

        </div>

      </nav>



      {/* HERO */}

      <section className="relative min-h-screen pt-20">

        <div className="absolute inset-0">

          <Image
            src="/hero-electrical.jpg"
            alt="Industrial electrical panels"
            fill
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-slate-900/70 to-black/80"></div>

        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">

          <div className="text-center max-w-4xl space-y-8">

            <div className="inline-block bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm font-semibold border border-blue-400/30">

              Transform Your Engineering Career

            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-white">

              Master Modern <br /> Engineering Technologies

            </h1>

            <p className="text-xl text-white/90 max-w-2xl mx-auto">

              Comprehensive internship programs in Electrical Systems, PLC
              Automation, Embedded Systems, IoT, and Telecommunications.

            </p>


            <div className="flex justify-center gap-4 flex-col sm:flex-row">

              <a href="#registration-form">

                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  Start Your Journey
                </Button>

              </a>


              <a
                href="https://wa.me/250783986252"
                target="_blank"
                rel="noopener noreferrer"
              >

                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 flex items-center gap-2"
                >

                  <MessageCircle size={18} />

                  Chat on WhatsApp

                </Button>

              </a>

            </div>

          </div>

        </div>

      </section>



      {/* PROGRAMS */}

      <section id="programs" className="px-4 py-20">

        <div className="mx-auto max-w-6xl">

          <div className="text-center mb-12">

            <h2 className="text-4xl font-bold">Our Internship Programs</h2>

            <p className="text-muted-foreground mt-4">

              Choose from our engineering training programs.

            </p>

          </div>


          <div className="grid gap-8 md:grid-cols-2">

            {PROGRAMS.map((program) => (

              <Card key={program.id} className="overflow-hidden">

                <div className="relative h-48">

                  <Image
                    src={program.image}
                    alt={program.label}
                    fill
                    className="object-cover"
                  />

                </div>

                <CardHeader>

                  <CardTitle>{program.label}</CardTitle>

                  <CardDescription>

                    {program.description}

                  </CardDescription>

                </CardHeader>

                <CardContent>

                  <a href="#registration-form">

                    <Button className="w-full">Enroll Now</Button>

                  </a>

                </CardContent>

              </Card>

            ))}

          </div>

        </div>

      </section>



      {/* REGISTRATION FORM */}

      <section id="registration-form" className="px-4 py-20 bg-muted/5">

        <div className="mx-auto max-w-3xl">

          <div className="text-center mb-10">

            <h2 className="text-4xl font-bold">

              Start Your Learning Journey

            </h2>

          </div>


          {successMessage && (

            <div className="mb-6 bg-green-100 text-green-800 p-4 rounded text-center">

              {successMessage}

            </div>

          )}


          <Card>

            <CardHeader>

              <CardTitle>Registration Form</CardTitle>

            </CardHeader>

            <CardContent>

              <form onSubmit={handleSubmit} className="space-y-5">


                <div>

                  <Label>Full Name</Label>

                  <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />

                </div>


                <div className="grid sm:grid-cols-2 gap-4">

                  <div>

                    <Label>Email</Label>

                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />

                  </div>


                  <div>

                    <Label>Phone</Label>

                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />

                  </div>

                </div>


                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >

                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}

                </Button>

              </form>

            </CardContent>

          </Card>

        </div>

      </section>



      {/* BENEFITS */}

      <section className="px-4 py-20">

        <div className="mx-auto max-w-6xl">

          <h2 className="text-4xl font-bold text-center mb-12">

            Why Choose Energy & Logics?

          </h2>


          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

            <Card>

              <CardHeader>
                <CardTitle>Hands-On Training</CardTitle>
              </CardHeader>

              <CardContent>
                Real equipment and industrial tools.
              </CardContent>

            </Card>


            <Card>

              <CardHeader>
                <CardTitle>Expert Instructors</CardTitle>
              </CardHeader>

              <CardContent>
                Learn from experienced engineers.
              </CardContent>

            </Card>


            <Card>

              <CardHeader>
                <CardTitle>Certification</CardTitle>
              </CardHeader>

              <CardContent>
                Receive professional certificates.
              </CardContent>

            </Card>


            <Card>

              <CardHeader>
                <CardTitle>Career Support</CardTitle>
              </CardHeader>

              <CardContent>
                Networking and career opportunities.
              </CardContent>

            </Card>

          </div>

        </div>

      </section>



      {/* CONTACT */}

      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white px-4 py-20">

        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-4xl font-bold mb-10">

            Get in Touch

          </h2>


          <div className="grid sm:grid-cols-3 gap-8">

            <div>

              <Phone className="mx-auto mb-4" />

              +250 783 986 252

            </div>


            <div>

              <Mail className="mx-auto mb-4" />

              energylogicsltd@gmail.com

            </div>


            <div>

              <MapPin className="mx-auto mb-4" />

              Nyamirambo, Kigali

            </div>

          </div>

        </div>

      </section>


    </main>

  );

}