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
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: '', nationalId: '', address: '',
    city: '', province: '', postalCode: '', country: 'Rwanda',
    school: '', fieldOfStudy: '', educationLevel: '', program: '',
    duration: '', password: '', confirmPassword: '', agreedToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
      if (!formData.school.trim()) newErrors.school = 'School is required';
      if (!formData.fieldOfStudy.trim()) newErrors.fieldOfStudy = 'Field of study is required';
      if (!formData.educationLevel) newErrors.educationLevel = 'Education level is required';
      if (!formData.program) newErrors.program = 'Program is required';
      if (!formData.duration) newErrors.duration = 'Duration is required';
    }

    if (stepNum === 4) {
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) router.push('/register/success');
      else setErrors({ submit: data.message });
    } catch {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
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
              Step {step} of 4: {step === 1 ? 'Personal Info' : step === 2 ? 'Address' : step === 3 ? 'Education & Program' : 'Account'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && <div className="text-red-600">{errors.submit}</div>}

              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                      {errors.firstName && <p className="text-red-600">{errors.firstName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                      {errors.lastName && <p className="text-red-600">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                    {errors.email && <p className="text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                    {errors.phone && <p className="text-red-600">{errors.phone}</p>}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} />
                      {errors.dateOfBirth && <p className="text-red-600">{errors.dateOfBirth}</p>}
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && <p className="text-red-600">{errors.gender}</p>}
                    </div>
                  </div>
                  <Button type="button" onClick={handleNextStep} className="w-full bg-blue-600 hover:bg-blue-700 flex justify-center items-center">
                    Next Step <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nationalId">National ID *</Label>
                    <Input id="nationalId" name="nationalId" value={formData.nationalId} onChange={handleInputChange} />
                    {errors.nationalId && <p className="text-red-600">{errors.nationalId}</p>}
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
                    {errors.address && <p className="text-red-600">{errors.address}</p>}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
                      {errors.city && <p className="text-red-600">{errors.city}</p>}
                    </div>
                    <div>
                      <Label htmlFor="province">Province *</Label>
                      <Input id="province" name="province" value={formData.province} onChange={handleInputChange} />
                      {errors.province && <p className="text-red-600">{errors.province}</p>}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} />
                    {errors.postalCode && <p className="text-red-600">{errors.postalCode}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => setStep(1)} variant="outline" className="flex-1">Previous</Button>
                    <Button type="button" onClick={handleNextStep} className="flex-1 bg-blue-600 hover:bg-blue-700">Next Step <ArrowRight className="ml-2 w-4 h-4" /></Button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="school">School/University *</Label>
                    <Input id="school" name="school" value={formData.school} onChange={handleInputChange} />
                    {errors.school && <p className="text-red-600">{errors.school}</p>}
                  </div>
                  <div>
                    <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                    <Input id="fieldOfStudy" name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleInputChange} />
                    {errors.fieldOfStudy && <p className="text-red-600">{errors.fieldOfStudy}</p>}
                  </div>
                  <div>
                    <Label htmlFor="educationLevel">Education Level *</Label>
                    <select id="educationLevel" name="educationLevel" value={formData.educationLevel} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1">
                      <option value="">Select Level</option>
                      <option value="High School">High School</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor">Bachelor's Degree</option>
                      <option value="Master">Master's Degree</option>
                    </select>
                    {errors.educationLevel && <p className="text-red-600">{errors.educationLevel}</p>}
                  </div>
                  <div>
                    <Label htmlFor="program">Program *</Label>
                    <select id="program" name="program" value={formData.program} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1">
                      <option value="">Select Program</option>
                      <option value="Embedded Systems">Embedded Systems</option>
                      <option value="Industrial Automation">Industrial Automation</option>
                      <option value="IoT Solutions">IoT Solutions</option>
                      <option value="PLC Programming">PLC Programming</option>
                      <option value="Arduino Development">Arduino Development</option>
                    </select>
                    {errors.program && <p className="text-red-600">{errors.program}</p>}
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration *</Label>
                    <select id="duration" name="duration" value={formData.duration} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1">
                      <option value="">Select Duration</option>
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                      <option value="12 months">12 months</option>
                    </select>
                    {errors.duration && <p className="text-red-600">{errors.duration}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => setStep(2)} variant="outline" className="flex-1">Previous</Button>
                    <Button type="button" onClick={handleNextStep} className="flex-1 bg-blue-600 hover:bg-blue-700">Next Step <ArrowRight className="ml-2 w-4 h-4" /></Button>
                  </div>
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} />
                    {errors.password && <p className="text-red-600">{errors.password}</p>}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} />
                    {errors.confirmPassword && <p className="text-red-600">{errors.confirmPassword}</p>}
                  </div>
                  <div className="flex items-start gap-2">
                    <input id="agreedToTerms" name="agreedToTerms" type="checkbox" checked={formData.agreedToTerms} onChange={handleInputChange} className="mt-1" />
                    <Label htmlFor="agreedToTerms" className="text-sm">I agree to terms and consent to be contacted *</Label>
                  </div>
                  {errors.agreedToTerms && <p className="text-red-600">{errors.agreedToTerms}</p>}
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => setStep(3)} variant="outline" className="flex-1">Previous</Button>
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={isLoading}>{isLoading ? 'Submitting...' : 'Submit Application'}</Button>
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