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
  { 
    id: 'ELT', 
    label: 'Electrical Technology (ELT)', 
    image: '/images/program-elt.jpg',
    description: 'Master domestic electricity, industrial control systems, and PLC automation.',
    fullDescription: 'Learn to design, install, and maintain electrical systems. From basic household wiring to industrial automation, gain hands-on experience with modern electrical technologies. This program covers electrical safety, circuit analysis, and advanced control systems.',
    skills: ['Circuit Design', 'PLC Programming', 'Industrial Systems', 'Safety Standards']
  },
  { 
    id: 'CSA', 
    label: 'Computer System and Architecture (CSA)', 
    image: '/images/program-csa.jpg',
    description: 'Embedded systems design and IoT microcontroller programming.',
    fullDescription: 'Build the foundation for modern computing systems. Learn computer architecture, microprocessor design, and embedded system programming. Perfect for those interested in creating intelligent devices and edge computing solutions.',
    skills: ['Microcontrollers', 'Assembly Language', 'Embedded Linux', 'System Design']
  },
  { 
    id: 'NIT', 
    label: 'Networking and Internet Technology (NIT)', 
    image: '/images/program-nit.jpg',
    description: 'IoT networking, device communication, and network infrastructure.',
    fullDescription: 'Connect the world of IoT devices. Master networking protocols, wireless communication, and device integration. Build scalable IoT systems with cloud connectivity and real-time data processing.',
    skills: ['Network Protocols', 'Wireless Communication', 'IoT Platforms', 'Cloud Integration']
  },
  { 
    id: 'ETE', 
    label: 'Electronics and Telecommunication Technology (ETE)', 
    image: '/images/program-ete.jpg',
    description: 'Electronic sensors, components, and telecommunications systems.',
    fullDescription: 'Understand the fundamentals of electronics and modern communication systems. Work with sensors, signal processing, and wireless technology. Essential for anyone pursuing advanced electronics and communication fields.',
    skills: ['Sensors & Transducers', 'Signal Processing', 'Wireless Technology', 'Telecom Systems']
  },
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
              Comprehensive internship programs in Electrical Systems, PLC Automation, Embedded Systems, IoT, and Telecommunications. Gain hands-on experience with industry experts.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-lg text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-6 py-3 w-fit mx-auto">
              <MapPin className="h-5 w-5" /> 
              <span>Nyamirambo, Kigali, Rwanda</span>
            </div>
            <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a href="#registration-form">
                <Button size="lg" className="text-base px-8 h-12">
                  Start Your Journey
                </Button>
              </a>
              <a href="https://wa.me/250783986252?text=Hello%20I%20am%20interested%20in%20your%20training%20program" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="flex items-center gap-2 text-base px-8 h-12 bg-white/10 border-white/30 text-white hover:bg-white/20">
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
              Choose from our comprehensive training programs designed to build your skills in modern engineering technologies. Each program combines theoretical knowledge with practical hands-on experience.
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
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {program.fullDescription}
                  </p>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Key Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {program.skills.map((skill) => (
                        <span key={skill} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a href="#registration-form" className="block mt-4">
                    <Button className="w-full">Enroll Now</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="registration-form" className="px-4 py-20 bg-gradient-to-b from-muted/5 to-background">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Start Your Learning Journey</h2>
            <p className="text-lg text-muted-foreground">
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

      {/* Benefits Section */}
      <section className="px-4 py-20 bg-muted/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose Energy & Logics?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-start gap-2">
                  <span className="text-2xl">🎯</span>
                  <span>Hands-On Training</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Learn by doing with real equipment and industry-standard tools. Practical experience that matters.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-start gap-2">
                  <span className="text-2xl">👨‍🏫</span>
                  <span>Expert Instructors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Learn from industry professionals with years of experience in engineering and technology.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-start gap-2">
                  <span className="text-2xl">📜</span>
                  <span>Certification</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Earn recognized certificates upon completion to enhance your professional profile.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-start gap-2">
                  <span className="text-2xl">💼</span>
                  <span>Career Support</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Get guidance for job placement and networking opportunities with industry leaders.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact & Footer */}
      <section className="bg-gradient-to-br from-primary to-primary/90 text-white px-4 py-20">
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

          {/* Footer */}
          <div className="border-t border-white/20 mt-16 pt-8 text-center">
            <p className="text-white/70 mb-4">&copy; 2024 Energy & Logics. All rights reserved.</p>
            <p className="text-white/60 text-sm">Engineering Sustainable Solutions • Building Tomorrow's Innovators</p>
          </div>
        </div>
      </section>

    </main>
  );
}
