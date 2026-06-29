import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserSupportAccess } from '@/lib/support/subscription-access'
import { generateTechnicalAssistantReply } from '@/lib/support/ai-assistant'

async function getSessionUser() {
  const cookieStore = await cookies()
  const session = cookieStore.get('user_session')
  if (!session?.value) return null
  try {
    return JSON.parse(session.value) as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Log in to use the AI assistant.' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const access = await getUserSupportAccess(user.id)
    if (!access.hasActiveSubscription || !access.canUseAiAssistant || !access.subscription) {
      return NextResponse.json(
        {
          error:
            access.aiMessagesRemaining === 0
              ? 'AI message limit reached. Upgrade your plan for more messages.'
              : access.blockReason ?? 'Active subscription required.',
          code: 'AI_LIMIT',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const message = String(body.message ?? '').trim()
    if (!message || message.length > 4000) {
      return NextResponse.json({ error: 'Message is required (max 4000 characters).' }, { status: 400 })
    }

    const { data: prior } = await supabaseAdmin
      .from('support_ai_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8)

    const history = (prior ?? [])
      .reverse()
      .map((row) => ({
        role: row.role as 'user' | 'assistant',
        content: String(row.content),
      }))

    const { reply, usedFallback } = await generateTechnicalAssistantReply(message, history)

    const subId = access.subscription.id
    const now = new Date().toISOString()

    await supabaseAdmin.from('support_ai_messages').insert([
      { user_id: user.id, subscription_id: subId, role: 'user', content: message },
      { user_id: user.id, subscription_id: subId, role: 'assistant', content: reply },
    ])

    await supabaseAdmin
      .from('support_subscriptions')
      .update({
        ai_messages_used: (access.subscription.ai_messages_used ?? 0) + 1,
        updated_at: now,
      })
      .eq('id', subId)

    return NextResponse.json({
      reply,
      usedFallback,
      aiMessagesRemaining:
        access.aiMessagesRemaining != null ? Math.max(0, access.aiMessagesRemaining - 1) : null,
    })
  } catch (error) {
    console.error('[support/ai-assist]', error)
    return NextResponse.json({ error: 'AI assistant unavailable' }, { status: 500 })
  }
}
