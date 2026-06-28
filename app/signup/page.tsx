import { redirect } from 'next/navigation'

/** Legacy route — unified registration lives at /auth/register */
export default function SignupPage() {
  redirect('/auth/register')
}
