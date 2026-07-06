import { NextResponse } from 'next/server'
import { getIremboPayConfig } from '@/lib/payments/irembopay-config'

export async function GET() {
  const config = getIremboPayConfig()
  return NextResponse.json({
    enabled: config.enabled,
    environment: config.environment,
    publicKey: config.publicKey || null,
  })
}
