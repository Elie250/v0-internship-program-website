import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const submitApplication = async (formData: any) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert([
        {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          program: formData.program,
          duration: formData.duration,
          current_level: formData.currentLevel,
          school: formData.school,
          field_of_study: formData.fieldOfStudy,
          province: formData.province,
          district: formData.district,
          date_of_birth: formData.dateOfBirth,
          motivation: formData.motivation,
          agreed_to_terms: formData.agreedToTerms,
          status: 'pending', // default status
          created_at: new Date()
        }
      ])

    if (error) {
      console.error('Supabase insert error:', error)
      return { success: false }
    }

    return { success: true, application: data }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false }
  }
}