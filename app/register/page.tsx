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

  // ---- FIXED handleInputChange ----
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;

    let value: string | boolean = '';
    if (target instanceof HTMLInputElement) {
      value = target.type === 'checkbox' ? target.checked : target.value;
    } else if (target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
      value = target.value;
    }

    setFormData(prev => ({
      ...prev,
      [target.name]: value,
    }));
  };
  // -------------------------------

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
        try {
          const responseData = await response.json();
          localStorage.setItem('student_email', formData.email);
          
          // Auto-login the newly registered student
          const studentId = responseData.data?.id || responseData.student_id || Date.now().toString();
          localStorage.setItem('student_auth_token', 'token_' + studentId);
          localStorage.setItem('student_id', studentId);
          localStorage.setItem('student_name', `${formData.firstName} ${formData.lastName}`);
          
          // Save application to admin dashboard
          const newApplication = {
            id: studentId,
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            program: formData.program,
            status: 'Pending',
            created_at: new Date().toISOString(),
          };
          
          const existingApps = localStorage.getItem('applications');
          const applications = existingApps ? JSON.parse(existingApps) : [];
          applications.push(newApplication);
          localStorage.setItem('applications', JSON.stringify(applications));
          
          router.push('/register/success');
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          setErrors({ submit: 'Registration saved but failed to process response' });
        }
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
                        className="mt-1"
                      />
                      {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                        className="mt-1"
                      />
                      {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
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
                      placeholder="your.email@example.com"
                      className="mt-1"
                    />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+250 78X XXX XXX"
                      className="mt-1"
                    />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      {errors.dateOfBirth && <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</p>}
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1"
                      >
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

              {/* Step 2: Address Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nationalId">National ID *</Label>
                    <Input
                      id="nationalId"
                      name="nationalId"
                      value={formData.nationalId}
                      onChange={handleInputChange}
                      placeholder="Your ID number"
                      className="mt-1"
                    />
                    {errors.nationalId && <p className="text-red-600 text-sm mt-1">{errors.nationalId}</p>}
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street address"
                      className="mt-1"
                    />
                    {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
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
                        className="mt-1"
                      />
                      {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <Label htmlFor="province">Province *</Label>
                      <Input
                        id="province"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        placeholder="Kigali City"
                        className="mt-1"
                      />
                      {errors.province && <p className="text-red-600 text-sm mt-1">{errors.province}</p>}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="00000"
                      className="mt-1"
                    />
                    {errors.postalCode && <p className="text-red-600 text-sm mt-1">{errors.postalCode}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => setStep(1)} variant="outline" className="flex-1">
                      Previous
                    </Button>
                    <Button type="button" onClick={handleNextStep} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Next Step <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
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
                      placeholder="Your school name"
                      className="mt-1"
                    />
                    {errors.school && <p className="text-red-600 text-sm mt-1">{errors.school}</p>}
                  </div>
                  <div>
                    <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                    <Input
                      id="fieldOfStudy"
                      name="fieldOfStudy"
                      value={formData.fieldOfStudy}
                      onChange={handleInputChange}
                      placeholder="e.g., Electrical Engineering"
                      className="mt-1"
                    />
                    {errors.fieldOfStudy && <p className="text-red-600 text-sm mt-1">{errors.fieldOfStudy}</p>}
                  </div>
                  <div>
                    <Label htmlFor="educationLevel">Education Level *</Label>
                    <select
                      id="educationLevel"
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1"
                    >
                      <option value="">Select Level</option>
                      <option value="High School">High School</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor">Bachelor's Degree</option>
                      <option value="Master">Master's Degree</option>
                    </select>
                    {errors.educationLevel && <p className="text-red-600 text-sm mt-1">{errors.educationLevel}</p>}
                  </div>
                  <div>
                    <Label htmlFor="program">Program *</Label>
                    <select
                      id="program"
                      name="program"
                      value={formData.program}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1"
                    >
                      <option value="">Select Program</option>
                      <option value="Embedded Systems">Embedded Systems</option>
                      <option value="Industrial Automation">Industrial Automation</option>
                      <option value="IoT Solutions">IoT Solutions</option>
                      <option value="PLC Programming">PLC Programming</option>
                      <option value="Arduino Development">Arduino Development</option>
                    </select>
                    {errors.program && <p className="text-red-600 text-sm mt-1">{errors.program}</p>}
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration *</Label>
                    <select
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1"
                    >
                      <option value="">Select Duration</option>
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                      <option value="12 months">12 months</option>
                    </select>
                    {errors.duration && <p className="text-red-600 text-sm mt-1">{errors.duration}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => setStep(2)} variant="outline" className="flex-1">
                      Previous
                    </Button>
                    <Button type="button" onClick={handleNextStep} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Next Step <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Create Account */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="At least 6 characters"
                      className="mt-1"
                    />
                    {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      className="mt-1"
                    />
                    {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      id="agreedToTerms"
                      name="agreedToTerms"
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <Label htmlFor="agreedToTerms" className="text-sm">
                      I agree to the terms and conditions and consent to be contacted about my application *
                    </Label>
                  </div>
                  {errors.agreedToTerms && <p className="text-red-600 text-sm">{errors.agreedToTerms}</p>}
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => setStep(3)} variant="outline" className="flex-1">
                      Previous
                    </Button>
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={isLoading}>
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
  );
}
