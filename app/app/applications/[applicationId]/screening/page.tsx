'use client'

import { useParams } from 'next/navigation'
import { ScreeningFlow } from '@/components/recruitment/screening-flow'

export default function CandidateScreeningPage() {
  const params = useParams<{ applicationId: string }>()
  return <ScreeningFlow applicationId={params.applicationId} />
}
