'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Cpu, Wifi, Waves, Clock, Users, Award, ArrowLeft, Radio } from 'lucide-react'

const PROGRAMS_DETAILED = [
  {
    id: 'ELT',
    title: 'Electrical Technology',
    icon: Zap,
    duration: '3-6 months',
    level: 'Beginner to Advanced',
    description: 'Master the fundamentals and advanced concepts of electrical systems, industrial automation, and power distribution.',
    modules: [
      'Domestic and Industrial Wiring',
      'PLC Programming and Control',
      'Motor Control Systems',
      'Safety Standards and Regulations',
      'Troubleshooting and Maintenance'
    ],
    skills: ['Circuit Design', 'Industrial Automation', 'Safety Compliance', 'Problem Solving'],
    image: '/programs/electrical.jpg'
  },
  {
    id: 'ETE',
    title: 'Electronics',
    icon: Radio,
    duration: '3-5 months',
    level: 'Beginner to Intermediate',
    description: 'Comprehensive training in electronic circuit design, signal processing, and telecommunications.',
    modules: [
      'Circuit Theory',
      'Electronic Components',
      'Signal Processing',
      'Telecommunications',
      'RF Design Basics'
    ],
    skills: ['Circuit Design', 'Testing & Measurement', 'Documentation', 'Innovation'],
    image: '/programs/electronics.jpg'
  },
  {
    id: 'CSA',
    title: 'Embedded Systems',
    icon: Cpu,
    duration: '4-6 months',
    level: 'Intermediate to Advanced',
    description: 'Deep dive into microcontroller programming, embedded systems design, and hardware-software integration.',
    modules: [
      'Microcontroller Architecture',
      'C/C++ Programming',
      'Embedded Linux',
      'IoT Device Development',
      'Real-time Systems'
    ],
    skills: ['Programming', 'System Design', 'Debugging', 'Prototyping'],
    image: '/images/embedded-systems.jpg' // moved to images folder
  },
  {
    id: 'NIT',
    title: 'IoT & Networking',
    icon: Wifi,
    duration: '3-4 months',
    level: 'Intermediate',
    description: 'Learn to design and implement IoT solutions, network infrastructure, and connected systems.',
    modules: [
      'Network Fundamentals',
      'IoT Protocols (MQTT, CoAP)',
      'Cloud Integration',
      'Sensor Networks',
      'Network Security'
    ],
    skills: ['Networking', 'IoT Development', 'Cloud Services', 'Data Integration'],
    image: '/programs/iot.jpg'
  }
]

export default function ProgramsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/">
            <Button variant="outline" className="mb-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back Home
            </Button>
          </Link>
          <h1 className="text-5xl font-bold mb-4">Our Programs</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl">
            Choose from our specialized engineering internship programs tailored to your interests and career goals.
          </p>
        </div>
      </div>

      {/* Programs Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {PROGRAMS_DETAILED.map((program) => {
              const Icon = program.icon
              return (
                <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow border-border hover:border-primary/50">
                  <img src={program.image} alt={program.title} className="w-full h-48 object-cover" />
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <Badge variant="secondary">{program.duration}</Badge>
                    </div>
                    <CardTitle className="text-2xl">{program.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">{program.level}</p>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <p className="text-foreground">{program.description}</p>

                    <div>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" /> Core Modules
                      </h4>
                      <ul className="space-y-2">
                        {program.modules.map((module, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                            {module}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-3">Key Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {program.skills.map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="border-primary/50 text-primary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Link href="/apply" className="block">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Apply for This Program
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Why Choose Energy & Logics?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border">
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Industry Experts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Learn from experienced engineers with years of practical industry experience.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <Award className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Hands-On Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Work with real equipment and complete practical projects in a professional environment.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <Clock className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Flexible Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Choose your preferred duration and schedule to fit your education and lifestyle.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}