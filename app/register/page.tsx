'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { UserPlus, ArrowRight } from "lucide-react"

export default function RegisterPage() {

  const router = useRouter()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    nationalId: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Rwanda",
    school: "",
    fieldOfStudy: "",
    educationLevel: "",
    program: "",
    duration: "",
    customDuration: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false
  })

  const handleInputChange = (e: any) => {

    const { name, value, type, checked } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))

  }

  const nextStep = () => {

    if (step < 4) {
      setStep(step + 1)
      window.scrollTo(0, 0)
    }

  }

  const prevStep = () => {

    if (step > 1) {
      setStep(step - 1)
      window.scrollTo(0, 0)
    }

  }

  const handleSubmit = async (e: any) => {

    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    const finalDuration =
      formData.duration === "custom"
        ? formData.customDuration
        : formData.duration

    setIsLoading(true)

    try {

      const res = await fetch("/api/register", {

        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          nationalId: formData.nationalId,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          country: formData.country,
          school: formData.school,
          fieldOfStudy: formData.fieldOfStudy,
          educationLevel: formData.educationLevel,
          program: formData.program,
          duration: finalDuration,
          password: formData.password

        })

      })

      const data = await res.json()

      if (res.ok) {

        localStorage.setItem("student_email", formData.email)

        router.push("/register/success")

      } else {

        alert(data.message)

      }

    } catch (err) {

      alert("Registration failed")

    }

    setIsLoading(false)

  }

  return (

    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">

      <div className="max-w-2xl mx-auto">

        <Card className="shadow-lg">

          <CardHeader>

            <div className="flex items-center gap-3 mb-4">

              <UserPlus className="w-8 h-8 text-blue-600" />

              <CardTitle className="text-2xl">Internship Application</CardTitle>

            </div>

            <div className="flex gap-2">

              {[1, 2, 3, 4].map(i => (

                <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-blue-600" : "bg-gray-300"}`} />

              ))}

            </div>

          </CardHeader>

          <CardContent>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* STEP 1 */}

              {step === 1 && (

                <div className="space-y-4">

                  <div className="grid md:grid-cols-2 gap-4">

                    <div>

                      <Label>First Name</Label>

                      <Input name="firstName" value={formData.firstName} onChange={handleInputChange} />

                    </div>

                    <div>

                      <Label>Last Name</Label>

                      <Input name="lastName" value={formData.lastName} onChange={handleInputChange} />

                    </div>

                  </div>

                  <div>

                    <Label>Email</Label>

                    <Input type="email" name="email" value={formData.email} onChange={handleInputChange} />

                  </div>

                  <div>

                    <Label>Phone</Label>

                    <Input name="phone" value={formData.phone} onChange={handleInputChange} />

                  </div>

                  <div className="grid md:grid-cols-2 gap-4">

                    <div>

                      <Label>Date of Birth</Label>

                      <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />

                    </div>

                    <div>

                      <Label>Gender</Label>

                      <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border rounded-md p-2">

                        <option value="">Select Gender</option>

                        <option>Male</option>
                        <option>Female</option>

                      </select>

                    </div>

                  </div>

                  <Button type="button" onClick={nextStep} className="w-full bg-blue-600">

                    Next Step <ArrowRight className="ml-2 w-4 h-4" />

                  </Button>

                </div>

              )}

              {/* STEP 2 */}

              {step === 2 && (

                <div className="space-y-4">

                  <div>

                    <Label>National ID</Label>

                    <Input name="nationalId" value={formData.nationalId} onChange={handleInputChange} />

                  </div>

                  <div>

                    <Label>Address</Label>

                    <Input name="address" value={formData.address} onChange={handleInputChange} />

                  </div>

                  <div className="grid md:grid-cols-3 gap-4">

                    <Input placeholder="City" name="city" value={formData.city} onChange={handleInputChange} />

                    <Input placeholder="Province" name="province" value={formData.province} onChange={handleInputChange} />

                    <Input placeholder="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleInputChange} />

                  </div>

                  <div className="flex gap-3">

                    <Button type="button" onClick={prevStep} className="bg-gray-300">

                      Previous

                    </Button>

                    <Button type="button" onClick={nextStep} className="bg-blue-600">

                      Next Step

                    </Button>

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

                  <div className="flex gap-3">

                    <Button type="button" onClick={prevStep} className="bg-gray-300">

                      Previous

                    </Button>

                    <Button type="button" onClick={nextStep} className="bg-blue-600">

                      Next Step

                    </Button>

                  </div>

                </div>

              )}

              {/* STEP 4 */}

              {step === 4 && (

                <div className="space-y-4">

                  <div>

                    <Label>Password</Label>

                    <Input type="password" name="password" value={formData.password} onChange={handleInputChange} />

                  </div>

                  <div>

                    <Label>Confirm Password</Label>

                    <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />

                  </div>

                  <label className="flex items-center gap-2">

                    <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleInputChange} />

                    I agree to the terms and conditions

                  </label>

                  <div className="flex gap-3">

                    <Button type="button" onClick={prevStep} className="bg-gray-300">

                      Previous

                    </Button>

                    <Button type="submit" className="bg-green-600 text-white w-full">

                      {isLoading ? "Submitting..." : "Submit Application"}

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