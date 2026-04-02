'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement & HTMLSelectElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateStep = (stepNum: number) => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
    }

    if (stepNum === 2) {
      if (!formData.nationalId.trim()) newErrors.nationalId = 'National ID is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.province.trim()) newErrors.province = 'Province is required';
      if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    }

    if (stepNum === 3) {
      if (!formData.school.trim()) newErrors.school = 'School/University name is required';
      if (!formData.fieldOfStudy.trim()) newErrors.fieldOfStudy = 'Field of study is required';
      if (!formData.educationLevel) newErrors.educationLevel = 'Education level is required';
      if (!formData.program) newErrors.program = 'Program is required';
      if (!formData.duration) newErrors.duration = 'Duration is required';
    }

    if (stepNum === 4) {
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        localStorage.setItem('student_email', formData.email);
        router.push('/register/success');
      } else {
        const data = await response.json();
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch (err) {
      setErrors({ submit: 'An error occurred. Please try again.' });
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="w-8 h-8 text-blue-600" />
              <CardTitle className="text-2xl">Internship Application</CardTitle>
            </div>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
              ))}
            </div>
            <p className="text-sm text-slate-600">
              Step {step} of 4: {
                step === 1 ? 'Personal Information' :
                step === 2 ? 'Address Details' :
                step === 3 ? 'Education & Program' :
                'Create Account'
              }
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900 border border-red-200">
                  {errors.submit}
                </div>
              )}

              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="John"
                        className={errors.firstName ? 'border-red-500' : ''}
                      />
                      {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                        className={errors.lastName ? 'border-red-500' : ''}
                      />
                      {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+250 7XX XXX XXX"
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className={errors.dateOfBirth ? 'border-red-500' : ''}
                      />
                      {errors.dateOfBirth && <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.gender ? 'border-red-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
                  </div>
                </div>
              )}

              {/* Step 2: Address Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nationalId">National ID Number *</Label>
                    <Input
                      id="nationalId"
                      name="nationalId"
                      value={formData.nationalId}
                      onChange={handleInputChange}
                      placeholder="1234567890123456"
                      className={errors.nationalId ? 'border-red-500' : ''}
                    />
                    {errors.nationalId && <p className="text-xs text-red-600 mt-1">{errors.nationalId}</p>}
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Kigali"
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <Label htmlFor="province">Province/District *</Label>
                      <Input
                        id="province"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        placeholder="Kigali City"
                        className={errors.province ? 'border-red-500' : ''}
                      />
                      {errors.province && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="00000"
                        className={errors.postalCode ? 'border-red-500' : ''}
                      />
                      {errors.postalCode && <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>}
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        disabled
                        className="bg-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Education & Program */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="school">School/University Name *</Label>
                    <Input
                      id="school"
                      name="school"
                      value={formData.school}
                      onChange={handleInputChange}
                      placeholder="University of Rwanda"
                      className={errors.school ? 'border-red-500' : ''}
                    />
                    {errors.school && <p className="text-xs text-red-600 mt-1">{errors.school}</p>}
                  </div>

                  <div>
                    <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                    <Input
                      id="fieldOfStudy"
                      name="fieldOfStudy"
                      value={formData.fieldOfStudy}
                      onChange={handleInputChange}
                      placeholder="Electrical Engineering"
                      className={errors.fieldOfStudy ? 'border-red-500' : ''}
                    />
                    {errors.fieldOfStudy && <p className="text-xs text-red-600 mt-1">{errors.fieldOfStudy}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="educationLevel">Education Level *</Label>
                      <select
                        id="educationLevel"
                        name="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.educationLevel ? 'border-red-500' : 'border-slate-300'
                        }`}
                      >
                        <option value="">Select Level</option>
                        <option value="Secondary">Secondary School</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Bachelor">Bachelor's Degree</option>
                        <option value="Master">Master's Degree</option>
                      </select>
                      {errors.educationLevel && <p className="text-xs text-red-600 mt-1">{errors.educationLevel}</p>}
                    </div>
                    <div>
                      <Label htmlFor="program">Program *</Label>
                      <select
                        id="program"
                        name="program"
                        value={formData.program}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.program ? 'border-red-500' : 'border-slate-300'
                        }`}
                      >
                        <option value="">Select Program</option>
                        <option value="Embedded Systems">Embedded Systems</option>
                        <option value="Industrial Automation">Industrial Automation</option>
                        <option value="IoT Solutions">IoT Solutions</option>
                      </select>
                      {errors.program && <p className="text-xs text-red-600 mt-1">{errors.program}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="duration">Preferred Duration *</Label>
                    <select
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.duration ? 'border-red-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Select Duration</option>
                      <option value="3 months">3 months</option>
                      <option value="4 months">4 months</option>
                      <option value="5 months">5 months</option>
                      <option value="6 months">6 months</option>
                    </select>
                    {errors.duration && <p className="text-xs text-red-600 mt-1">{errors.duration}</p>}
                  </div>
                </div>
              )}

              {/* Step 4: Account Creation */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password">Create Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="At least 6 characters"
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter your password"
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                    />
                    {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="agreedToTerms"
                      name="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4"
                    />
                    <label htmlFor="agreedToTerms" className="text-sm text-slate-700">
                      I agree to the terms and conditions and understand that this is an internship application
                    </label>
                  </div>
                  {errors.agreedToTerms && <p className="text-xs text-red-600">{errors.agreedToTerms}</p>}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-6">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                {step < 4 && (
                  <Button
                    type="button"
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                    onClick={handleNextStep}
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
                {step === 4 && (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                  >
                    {isLoading ? 'Submitting...' : 'Complete Registration'}
                  </Button>
                )}
              </div>
            </form>

            <p className="text-xs text-slate-500 text-center mt-6">
              Already registered? <Link href="/student/login" className="text-blue-600 hover:underline">Login here</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
