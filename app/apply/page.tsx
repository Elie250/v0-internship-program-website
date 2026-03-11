'use client';

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

const PROGRAMS = [
  { id: 'ELT', label: 'Electrical Technology' },
  { id: 'CSA', label: 'Embedded Systems' },
  { id: 'NIT', label: 'IoT & Networking' },
  { id: 'ETE', label: 'Electronics' }
]

const DURATIONS = [
  { id: '3', label: '3 Months' },
  { id: '4', label: '4 Months' },
  { id: '5', label: '5 Months' },
  { id: '6', label: '6 Months' }
]

const LEVELS = [
  { id: 'secondary', label: 'Secondary School' },
  { id: 'technician', label: 'Technician Diploma' },
  { id: 'bachelor', label: 'Bachelor Degree' },
  { id: 'professional', label: 'Working Professional' }
]

const PROVINCES = [
  'Kigali City',
  'Eastern Province',
  'Northern Province',
  'Southern Province',
  'Western Province',
  'Other'
]

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    program: '',
    duration: '',
    currentLevel: '',
    school: '',
    fieldOfStudy: '',
    province: '',
    district: '',
    dateOfBirth: '',
    motivation: '',
    agreedToTerms: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSubmitted(true)
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          program: '',
          duration: '',
          currentLevel: '',
          school: '',
          fieldOfStudy: '',
          province: '',
          district: '',
          dateOfBirth: '',
          motivation: '',
          agreedToTerms: false
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-primary/20 bg-primary/5">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Application Submitted!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for your interest in our internship programs. We have received your application and will review it shortly.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              You will receive confirmation and next steps via email.
            </p>
            <Link href="/">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/programs">
            <Button variant="outline" className="mb-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
          <h1 className="text-5xl font-bold mb-4">Apply for Internship</h1>
          <p className="text-lg text-primary-foreground/90">
            Complete your application and start your engineering journey with Energy & Logics.
          </p>
        </div>
      </div>

      {/* Form */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Application Form</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
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
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="province">Province *</Label>
                        <Select onValueChange={(value) => handleSelectChange('province', value)} value={formData.province}>
                          <SelectTrigger id="province" className="mt-1">
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROVINCES.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="district">District *</Label>
                      <Input
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Program Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Program Selection</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="program">Preferred Program *</Label>
                      <Select onValueChange={(value) => handleSelectChange('program', value)} value={formData.program}>
                        <SelectTrigger id="program" className="mt-1">
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROGRAMS.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Preferred Duration *</Label>
                        <Select onValueChange={(value) => handleSelectChange('duration', value)} value={formData.duration}>
                          <SelectTrigger id="duration" className="mt-1">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {DURATIONS.map(d => (
                              <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="currentLevel">Current Educational Level *</Label>
                        <Select onValueChange={(value) => handleSelectChange('currentLevel', value)} value={formData.currentLevel}>
                          <SelectTrigger id="currentLevel" className="mt-1">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {LEVELS.map(l => (
                              <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Education Background */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Education Background</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="school">School/College/University</Label>
                      <Input
                        id="school"
                        name="school"
                        value={formData.school}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fieldOfStudy">Field of Study</Label>
                      <Input
                        id="fieldOfStudy"
                        name="fieldOfStudy"
                        value={formData.fieldOfStudy}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Motivation */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Why You're Interested</h3>
                  <div>
                    <Label htmlFor="motivation">Tell us why you want to join this program *</Label>
                    <Textarea
                      id="motivation"
                      name="motivation"
                      value={formData.motivation}
                      onChange={handleInputChange}
                      placeholder="Share your motivation, goals, and what you hope to achieve..."
                      required
                      className="mt-1 min-h-32"
                    />
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreedToTerms: checked as boolean }))}
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground mt-0.5">
                      I agree to the terms and conditions and understand that my information will be used to process my application.
                    </Label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={loading || !formData.agreedToTerms}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 text-base"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">What Happens Next?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>1. We review your application within 2-3 business days</li>
                <li>2. You'll receive a confirmation email with next steps</li>
                <li>3. Schedule your interview with our admissions team</li>
                <li>4. Get accepted and start your engineering journey!</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
