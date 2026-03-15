export interface Registration {
  id: string
  full_name: string
  email: string
  registration_type: string
  program: string
  duration: string
  status: string // 'accepted' | 'declined' | 'pending'
  created_at: string
}