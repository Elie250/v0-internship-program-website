import { NextResponse } from 'next/server'
import { queryPublishedSupportPlans } from '@/lib/admin/data/support-plans'

export async function GET() {
  const { plans, error } = await queryPublishedSupportPlans()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(plans)
}
