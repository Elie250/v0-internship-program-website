'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Zap, Cpu, Wifi, Lightbulb, Code, AlertCircle } from 'lucide-react';
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
  { level: 'Level 5 & Level 4', price: '30,000 RWF' },
  { level: 'Level 3', price: '20,000 RWF', subtext: '(2 weeks)' },
];

const INDIVIDUAL_TRAINING = [
  {
    id: 'embedded',
    title: 'Embedded Systems & IoT',
    icon: Cpu,
    features: ['Arduino programming', 'Sensors and actuators', 'IoT system development', 'Hardware projects']
  },
  {
    id: 'plc',
    title: 'PLC & Industrial Automation',
    icon: Zap,
    features: ['Industrial control systems', 'Motor control circuits', 'PLC programming', 'Automation troubleshooting']
  },
  {
    id: 'electrical',
    title: 'Electrical Installation',
    icon: Lightbulb,
    features: ['Domestic wiring', 'Electrical safety', 'Electrical panels', 'Troubleshooting systems']
  }
];

const TRAINING_FORMATS = ['Weekend classes', 'Evening training', 'Intensive bootcamp'];
const DURATION_OPTIONS = ['2 weeks', '1 month', 'Custom schedule'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'student' | 'individual'>('student');
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
  const [individualFormData, setIndividualFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
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
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
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
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/hero-electrical.jpg" 
            alt="Industrial electrical panels" 
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-primary/70 mix-blend-overlay"></div>
        </div>
        
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Electrical & Automation Internship Program
            </h1>
            <p className="mt-6 text-xl text-white/90">
              Gain practical skills in Electrical Systems, PLC Automation, Embedded Systems and IoT
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-lg text-white">
              <MapPin className="h-5 w-5" />
              <span>Nyamirambo, Kigali, Rwanda</span>
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
              <a href="#student-form" className="inline-block">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Register Now
                </Button>
              </a>
              <a href="https://wa.me/250783986252" target="_blank" rel="noopener noreferrer" className="inline-block">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-balance text-center text-4xl font-bold">Student Internship Programs</h2>
          <p className="mt-4 text-center text-muted-foreground">
            Choose from our comprehensive programs designed for students pursuing technical education
          </p>
          
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((program) => (
              <Card key={program.id} className="border-border bg-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-primary text-lg">{program.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {program.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Programs Grid with Images */}
          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="relative h-48 w-full overflow-hidden rounded-lg">
                <Image 
                  src="/plc-automation.jpg" 
                  alt="PLC Automation Systems" 
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">Industrial PLC & Automation</h3>
              <p className="text-muted-foreground">Learn control systems and automation used in industrial environments</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="relative h-48 w-full overflow-hidden rounded-lg">
                <Image 
                  src="/embedded-systems.jpg" 
                  alt="Embedded Systems & Arduino" 
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">Embedded Systems & IoT</h3>
              <p className="text-muted-foreground">Master microcontrollers, sensors, and Internet of Things technology</p>
            </div>
          </div>
        </div>
      </section>

      {/* Individual Professional Training Section */}
      <section className="border-t border-border px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-balance text-center text-4xl font-bold">Individual Professional Training</h2>
          <p className="mt-4 text-center text-muted-foreground max-w-3xl mx-auto">
            This program is for professionals such as technicians, engineers, graduates, or anyone interested in learning practical engineering skills at their own pace.
          </p>
          
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {INDIVIDUAL_TRAINING.map((training) => {
              const Icon = training.icon;
              return (
                <Card key={training.id} className="border-border bg-card hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-8 w-8 text-accent" />
                      <CardTitle className="text-lg">{training.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {training.features.map((feature) => (
                        <li key={feature} className="flex gap-2 text-sm">
                          <span className="text-accent">•</span>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="font-semibold text-primary mb-3">Training Format</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {TRAINING_FORMATS.map((format) => (
                  <li key={format} className="flex gap-2">
                    <span className="text-accent">✓</span>
                    {format}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-3">Duration Options</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {DURATION_OPTIONS.map((duration) => (
                  <li key={duration} className="flex gap-2">
                    <span className="text-accent">✓</span>
                    {duration}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-2 lg:col-span-2 flex flex-col justify-center">
              <a href="#individual-form" className="inline-block">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Apply for Individual Training
                </Button>
              </a>
            </div>
          </div>

          {/* Training Image */}
          <div className="mt-12 relative h-80 w-full overflow-hidden rounded-lg">
            <Image 
              src="/student-training.jpg" 
              alt="Student training in electrical laboratory" 
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Fees Section */}
      <section className="border-t border-border bg-muted/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-balance text-center text-4xl font-bold">Program Fees</h2>
          <p className="mt-4 text-center text-muted-foreground">
            Flexible pricing for all internship levels with included benefits
          </p>
          
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {FEES.map((fee) => (
              <Card key={fee.level} className="border-2 border-accent bg-card text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">{fee.level}</CardTitle>
                  {fee.subtext && <CardDescription className="text-muted-foreground">{fee.subtext}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-accent mb-4">{fee.price}</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2 justify-start">
                      <span className="text-accent">✓</span>
                      Hands-on practical training
                    </li>
                    <li className="flex gap-2 justify-start">
                      <span className="text-accent">✓</span>
                      Real engineering projects
                    </li>
                    <li className="flex gap-2 justify-start">
                      <span className="text-accent">✓</span>
                      Completion certificate
                    </li>
                  </ul>
                </CardContent>
              </Card>
            ))}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Individual Training</CardTitle>
                <CardDescription>Custom pricing available</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Contact us for pricing on individual professional training programs tailored to your needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section id="student-form" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-balance text-center text-4xl font-bold">Join Our Internship Program</h2>
          <p className="mt-4 text-center text-muted-foreground">
            Complete the form to begin your engineering journey with us
          </p>

          <Card className="mt-10 border-border">
            <CardHeader className="bg-primary/5 border-b border-border">
              <CardTitle>Student Registration Form</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isSuccess && (
                <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-900 border border-green-200 flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Registration received!</p>
                    <p>We will contact you soon at the provided phone number.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
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

      {/* Individual Training Form Section */}
      <section id="individual-form" className="border-t border-border bg-muted/5 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-balance text-center text-4xl font-bold">Individual Professional Training</h2>
          <p className="mt-4 text-center text-muted-foreground">
            Not a student? No problem! Apply for our professional training programs
          </p>

          <Card className="mt-10 border-border">
            <CardHeader className="bg-accent/5 border-b border-border">
              <CardTitle>Professional Training Registration</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isSuccess && activeTab === 'individual' && (
                <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-900 border border-green-200 flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Registration received!</p>
                    <p>We will contact you soon to discuss your training preferences.</p>
                  </div>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  const submissionData = {
                    ...individualFormData,
                    registrationType: 'Individual Training'
                  };
                  await submitRegistration(submissionData);
                  setIsSuccess(true);
                  setIndividualFormData({
                    fullName: '',
                    phone: '',
                    email: '',
                    profession: '',
                    trainingProgram: '',
                    schedule: '',
                    message: '',
                  });
                  setTimeout(() => setIsSuccess(false), 5000);
                } catch (error) {
                  console.error('Error submitting registration:', error);
                } finally {
                  setIsSubmitting(false);
                }
              }} className="space-y-5">
                <div>
                  <Label htmlFor="ind-fullName">Full Name *</Label>
                  <Input
                    id="ind-fullName"
                    name="fullName"
                    value={individualFormData.fullName}
                    onChange={(e) => setIndividualFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="ind-phone">Phone Number *</Label>
                    <Input
                      id="ind-phone"
                      name="phone"
                      value={individualFormData.phone}
                      onChange={(e) => setIndividualFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+250 78X XXX XXX"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ind-email">Email *</Label>
                    <Input
                      id="ind-email"
                      name="email"
                      type="email"
                      value={individualFormData.email}
                      onChange={(e) => setIndividualFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="profession">Profession / Position *</Label>
                  <Input
                    id="profession"
                    name="profession"
                    value={individualFormData.profession}
                    onChange={(e) => setIndividualFormData(prev => ({ ...prev, profession: e.target.value }))}
                    placeholder="e.g., Technician, Engineer, Graduate"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="trainingProgram">Training Program *</Label>
                    <Select value={individualFormData.trainingProgram} onValueChange={(value) => setIndividualFormData(prev => ({ ...prev, trainingProgram: value }))}>
                      <SelectTrigger id="trainingProgram" className="mt-1">
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Embedded Systems & IoT">Embedded Systems & IoT</SelectItem>
                        <SelectItem value="PLC & Industrial Automation">PLC & Industrial Automation</SelectItem>
                        <SelectItem value="Electrical Installation">Electrical Installation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="schedule">Preferred Schedule *</Label>
                    <Select value={individualFormData.schedule} onValueChange={(value) => setIndividualFormData(prev => ({ ...prev, schedule: value }))}>
                      <SelectTrigger id="schedule" className="mt-1">
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weekend classes">Weekend classes</SelectItem>
                        <SelectItem value="Evening training">Evening training</SelectItem>
                        <SelectItem value="Intensive bootcamp">Intensive bootcamp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ind-message">Message</Label>
                  <Textarea
                    id="ind-message"
                    name="message"
                    value={individualFormData.message}
                    onChange={(e) => setIndividualFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us about your background and training goals (optional)"
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Apply for Training'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="border-t border-border bg-primary px-4 py-16 sm:px-6 lg:px-8 text-primary-foreground">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-balance text-center text-4xl font-bold">Get in Touch</h2>
          <p className="mt-4 text-center text-primary-foreground/80">
            Have questions? We're here to help you start your engineering journey
          </p>
          
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <Phone className="mx-auto h-10 w-10 text-accent" />
              <h3 className="mt-4 font-semibold text-lg">Phone / WhatsApp</h3>
              <a href="https://wa.me/250783986252" className="mt-2 text-sm text-primary-foreground/90 hover:text-white transition">
                +250 783 986 252
              </a>
            </div>
            <div className="text-center">
              <Mail className="mx-auto h-10 w-10 text-accent" />
              <h3 className="mt-4 font-semibold text-lg">Email</h3>
              <a href="mailto:energylogicsltd@gmail.com" className="mt-2 text-sm text-primary-foreground/90 hover:text-white transition">
                energylogicsltd@gmail.com
              </a>
            </div>
            <div className="text-center">
              <MapPin className="mx-auto h-10 w-10 text-accent" />
              <h3 className="mt-4 font-semibold text-lg">Location</h3>
              <p className="mt-2 text-sm text-primary-foreground/90">Nyamirambo, Kigali, Rwanda</p>
            </div>
          </div>

          {/* Floating WhatsApp Button Indicator */}
          <div className="mt-12 text-center">
            <p className="text-sm text-primary-foreground/80">
              💬 Quick question? Send us a message on WhatsApp for instant support
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo.png" alt="Energy & Logics" width={32} height={32} />
                <div>
                  <div className="font-bold text-sm">Energy & Logics</div>
                  <div className="text-xs text-muted-foreground">Engineering Sustainable Solutions</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Navigation</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Home</a></li>
                <li><a href="#programs" className="hover:text-primary transition">Programs</a></li>
                <li><a href="#student-form" className="hover:text-primary transition">Register</a></li>
                <li><a href="#individual-form" className="hover:text-primary transition">Training</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Phone: +250 783 986 252</li>
                <li>Email: energylogicsltd@gmail.com</li>
                <li>Location: Nyamirambo, Kigali</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Follow Us</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-primary transition">Facebook</a></li>
                <li><a href="#" className="hover:text-primary transition">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition">TikTok</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Energy and Logics Ltd. All rights reserved. Engineering Sustainable Solutions.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
