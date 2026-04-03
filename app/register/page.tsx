'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserPlus, ArrowRight } from 'lucide-react';

export default function RegisterPage() {

  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationalId: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Rwanda',
    school: '',
    fieldOfStudy: '',
    educationLevel: '',
    program: '',
    duration: '',
    customDuration: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  })

  const [errors, setErrors] = useState<any>({})
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleNextStep = () => { setStep(step + 1) }
  const handlePreviousStep = () => { setStep(step - 1) }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    const finalDuration =
      formData.duration === 'custom'
        ? formData.customDuration
        : formData.duration

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      date_of_birth: formData.dateOfBirth,
      gender: formData.gender,
      national_id: formData.nationalId,
      address: formData.address,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postalCode,
      country: formData.country,
      school: formData.school,
      field_of_study: formData.fieldOfStudy,
      education_level: formData.educationLevel,
      program: formData.program,
      duration: finalDuration,
      password: formData.password
    }

    setIsLoading(true)

    try {

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/student/login')
      }
      else {
        setErrors({ submit: data.message })
      }

    } catch (err) {
      setErrors({ submit: 'Registration failed' })
    }

    setIsLoading(false)

  }

  return (

    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">

      <div className="max-w-2xl mx-auto">

        <Card>

          <CardHeader>

            <div className="flex items-center gap-3">

              <UserPlus className="text-blue-600" />

              <CardTitle>Internship Application</CardTitle>

            </div>

          </CardHeader>

          <CardContent>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* STEP 1 */}

              {step === 1 && (

                <div className="space-y-4">

                  <Input placeholder="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />

                  <Input placeholder="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />

                  <Input placeholder="Email" name="email" value={formData.email} onChange={handleInputChange} />

                  <Input placeholder="Phone" name="phone" value={formData.phone} onChange={handleInputChange} />

                  <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />

                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border rounded-md p-2">

                    <option value="">Select Gender</option>

                    <option>Male</option>

                    <option>Female</option>

                  </select>

                  <Button type="button" onClick={handleNextStep} className="w-full bg-blue-600">

                    Next <ArrowRight className="ml-2 w-4 h-4" />

                  </Button>

                </div>

              )}

              {/* STEP 2 */}

              {step === 2 && (

                <div className="space-y-4">

                  <Input placeholder="National ID" name="nationalId" value={formData.nationalId} onChange={handleInputChange} />

                  <Input placeholder="Address" name="address" value={formData.address} onChange={handleInputChange} />

                  <Input placeholder="City" name="city" value={formData.city} onChange={handleInputChange} />

                  <Input placeholder="Province" name="province" value={formData.province} onChange={handleInputChange} />

                  <Input placeholder="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleInputChange} />

                  <div className="flex gap-2">

                    <Button type="button" onClick={handlePreviousStep}>Previous</Button>

                    <Button type="button" onClick={handleNextStep}>Next</Button>

                  </div>

                </div>

              )}

              {/* STEP 3 */}

              {step === 3 && (

                <div className="space-y-4">

                  <Input placeholder="School / University" name="school" value={formData.school} onChange={handleInputChange} />

                  <Input placeholder="Field of Study" name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleInputChange} />

                  <select name="educationLevel" value={formData.educationLevel} onChange={handleInputChange} className="w-full border rounded-md p-2">

                    <option value="">Education Level</option>

                    <option>High school</option>

                    <option>Advanced diploma</option>

                    <option>A0 degree</option>

                    <option>Masters</option>

                  </select>

                  <select name="program" value={formData.program} onChange={handleInputChange} className="w-full border rounded-md p-2">

                    <option value="">Select Program</option>

                    <option>Embedded Systems Bootcamp</option>

                    <option>Industrial Automation</option>

                    <option>IoT Development</option>

                    <option>Advanced PLC & Networking</option>

                  </select>

                  <select name="duration" value={formData.duration} onChange={handleInputChange} className="w-full border rounded-md p-2">

                    <option value="">Duration</option>

                    <option>2 weeks</option>

                    <option>1 month</option>

                    <option>3 months</option>

                    <option>6 months</option>

                    <option value="custom">Custom</option>

                  </select>

                  {formData.duration === "custom" && (

                    <Input

                      placeholder="Enter custom duration"

                      name="customDuration"

                      value={formData.customDuration}

                      onChange={handleInputChange}

                    />

                  )}

                  <div className="flex gap-2">

                    <Button type="button" onClick={handlePreviousStep}>Previous</Button>

                    <Button type="button" onClick={handleNextStep}>Next</Button>

                  </div>

                </div>

              )}

              {/* STEP 4 */}

              {step === 4 && (

                <div className="space-y-4">

                  <Input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleInputChange} />

                  <Input type="password" placeholder="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />

                  <label className="flex items-center gap-2">

                    <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleInputChange} />

                    Agree to terms

                  </label>

                  <div className="flex gap-2">

                    <Button type="button" onClick={handlePreviousStep}>Previous</Button>

                    <Button type="submit" className="bg-green-600 text-white">

                      {isLoading ? 'Submitting...' : 'Submit Application'}

                    </Button>

                  </div>

                </div>

              )}

            </form>

          </CardContent>

        </Card>

      </div>

    </main>

  )

}