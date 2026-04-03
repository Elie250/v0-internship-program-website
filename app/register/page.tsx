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
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    let value: string | boolean = '';
    if (target instanceof HTMLInputElement) {
      value = target.type === 'checkbox' ? target.checked : target.value;
    } else if (target instanceof HTMLSelectElement) {
      value = target.value;
    }
    setFormData(prev => ({
      ...prev,
      [target.name]: value,
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
      if (!formData.program.trim()) newErrors.program = 'Program is required';
      if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
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

  const handlePreviousStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
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

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('student_email', formData.email);
        router.push('/register/success');
      } else {
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'An error occurred. Please try again.' });
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
              <CardTitle className="text-2xl">Registration</CardTitle>
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

              {/* ------------------ STEP 1 ------------------ */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input name="firstName" value={formData.firstName} onChange={handleInputChange} />
                      {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input name="lastName" value={formData.lastName} onChange={handleInputChange} />
                      {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input name="email" type="email" value={formData.email} onChange={handleInputChange} />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input name="phone" value={formData.phone} onChange={handleInputChange} />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} />
                      {errors.dateOfBirth && <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</p>}
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border rounded-md">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender}</p>}
                    </div>
                  </div>
                  <Button type="button" onClick={handleNextStep} className="w-full bg-blue-600 hover:bg-blue-700">
                    Next Step <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* ------------------ STEP 2 ------------------ */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nationalId">National ID *</Label>
                    <Input name="nationalId" value={formData.nationalId} onChange={handleInputChange} />
                    {errors.nationalId && <p className="text-red-600 text-sm mt-1">{errors.nationalId}</p>}
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input name="address" value={formData.address} onChange={handleInputChange} />
                    {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input name="city" value={formData.city} onChange={handleInputChange} />
                      {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <Label htmlFor="province">Province *</Label>
                      <Input name="province" value={formData.province} onChange={handleInputChange} />
                      {errors.province && <p className="text-red-600 text-sm mt-1">{errors.province}</p>}
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input name="postalCode" value={formData.postalCode} onChange={handleInputChange} />
                      {errors.postalCode && <p className="text-red-600 text-sm mt-1">{errors.postalCode}</p>}
                    </div>
                  </div>
                  <Button type="button" onClick={handlePreviousStep} className="bg-gray-300 hover:bg-gray-400 mr-2">Previous</Button>
                  <Button type="button" onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700">Next Step <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </div>
              )}

              {/* ------------------ STEP 3 ------------------ */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="school">School/University *</Label>
                    <Input name="school" value={formData.school} onChange={handleInputChange} />
                    {errors.school && <p className="text-red-600 text-sm mt-1">{errors.school}</p>}
                  </div>
                  <div>
                    <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                    <Input name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleInputChange} />
                    {errors.fieldOfStudy && <p className="text-red-600 text-sm mt-1">{errors.fieldOfStudy}</p>}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="educationLevel">Education Level *</Label>
                      <select name="educationLevel" value={formData.educationLevel} onChange={handleInputChange} className="w-full border rounded-md">
                        <option value="">Select Level</option>
                        <option value="High School">High School</option>
                        <option value="Bachelor">Bachelor</option>
                        <option value="Master">Master</option>
                        <option value="PhD">PhD</option>
                      </select>
                      {errors.educationLevel && <p className="text-red-600 text-sm mt-1">{errors.educationLevel}</p>}
                    </div>
                    <div>
                      <Label htmlFor="program">Program *</Label>
                      <Input name="program" value={formData.program} onChange={handleInputChange} />
                      {errors.program && <p className="text-red-600 text-sm mt-1">{errors.program}</p>}
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration *</Label>
                      <Input name="duration" value={formData.duration} onChange={handleInputChange} />
                      {errors.duration && <p className="text-red-600 text-sm mt-1">{errors.duration}</p>}
                    </div>
                  </div>
                  <Button type="button" onClick={handlePreviousStep} className="bg-gray-300 hover:bg-gray-400 mr-2">Previous</Button>
                  <Button type="button" onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700">Next Step <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </div>
              )}

              {/* ------------------ STEP 4 ------------------ */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input type="password" name="password" value={formData.password} onChange={handleInputChange} />
                    {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />
                    {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleInputChange} />
                    <Label htmlFor="agreedToTerms">I agree to the terms and conditions *</Label>
                  </div>
                  {errors.agreedToTerms && <p className="text-red-600 text-sm mt-1">{errors.agreedToTerms}</p>}

                  <Button type="button" onClick={handlePreviousStep} className="bg-gray-300 hover:bg-gray-400 mr-2">Previous</Button>
                  <Button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
                    {isLoading ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}