'use client'

import { useState } from "react"
import Image from "next/image"
import { submitRegistration } from "@/app/actions/register"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function Home() {

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    registrationType: "",
    fullName: "",
    email: "",
    phone: "",
    school: "",
    program: "",
    level: "",
    duration: "",
    profession: "",
    trainingProgram: "",
    schedule: "",
    message: ""
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!formData.registrationType) {
      alert("Please select registration type")
      return
    }

    setIsSubmitting(true)
    try {
      await submitRegistration(formData)
      setSuccess(true)
      setFormData({
        registrationType: "",
        fullName: "",
        email: "",
        phone: "",
        school: "",
        program: "",
        level: "",
        duration: "",
        profession: "",
        trainingProgram: "",
        schedule: "",
        message: ""
      })
      setTimeout(() => setSuccess(false), 5000)
    } catch (error) {
      console.log(error)
      alert("Error submitting registration")
    }
    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen p-10 bg-gray-50">

      <h1 className="text-4xl font-bold text-center mb-10">
        Energy & Logics Training Registration
      </h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto space-y-5 p-6 bg-white rounded shadow"
      >

        {/* REGISTRATION TYPE */}
        <div>
          <Label>Registration Type</Label>
          <select
            name="registrationType"
            value={formData.registrationType}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select type</option>
            <option value="Student">Student Internship</option>
            <option value="Individual">Individual Training</option>
          </select>
        </div>

        {/* BASIC INFO */}
        <div>
          <Label>Full Name</Label>
          <Input name="fullName" value={formData.fullName} onChange={handleChange} required />
        </div>

        <div>
          <Label>Email</Label>
          <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div>
          <Label>Phone</Label>
          <Input name="phone" value={formData.phone} onChange={handleChange} required />
        </div>

        {/* STUDENT FIELDS */}
        {formData.registrationType === "Student" && (
          <>
            <div>
              <Label>School</Label>
              <Input name="school" value={formData.school} onChange={handleChange} />
            </div>
            <div>
              <Label>Program</Label>
              <Input name="program" value={formData.program} onChange={handleChange} />
            </div>
            <div>
              <Label>Level</Label>
              <Input name="level" value={formData.level} onChange={handleChange} />
            </div>
            <div>
              <Label>Duration</Label>
              <Input name="duration" value={formData.duration} onChange={handleChange} />
            </div>
          </>
        )}

        {/* INDIVIDUAL FIELDS */}
        {formData.registrationType === "Individual" && (
          <>
            <div>
              <Label>Profession</Label>
              <Input name="profession" value={formData.profession} onChange={handleChange} />
            </div>
            <div>
              <Label>Training Program</Label>
              <Input name="trainingProgram" value={formData.trainingProgram} onChange={handleChange} />
            </div>
            <div>
              <Label>Schedule</Label>
              <Input name="schedule" value={formData.schedule} onChange={handleChange} />
            </div>
          </>
        )}

        {/* MESSAGE */}
        <div>
          <Label>Message</Label>
          <Textarea name="message" value={formData.message} onChange={handleChange} />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Register"}
        </Button>

        {success && (
          <p className="text-green-600 text-center">
            Registration submitted successfully!
          </p>
        )}

      </form>
    </main>
  )
}