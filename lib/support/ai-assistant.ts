const SYSTEM_PROMPT = `You are the Energy & Logics Engineering Hub AI assistant. You help engineers and technicians in Rwanda and East Africa with:
- PLC programming and industrial automation (ladder logic, VFD, HMI)
- Electrical systems, wiring, protection, and solar
- Embedded systems, microcontrollers, sensors, and IoT

Give practical, safety-conscious advice. If a question needs hands-on inspection or violates safety rules, say so and recommend opening a human support ticket.
Keep answers concise (under 400 words) unless the user asks for detail.`

export type AiAssistantResult = {
  reply: string
  usedFallback: boolean
}

export async function generateTechnicalAssistantReply(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AiAssistantResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    return {
      usedFallback: true,
      reply: buildFallbackReply(userMessage),
    }
  }

  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage },
    ]

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        messages,
        max_tokens: 800,
        temperature: 0.4,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[ai-assistant] OpenAI error', res.status, errText)
      return { usedFallback: true, reply: buildFallbackReply(userMessage) }
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return { usedFallback: true, reply: buildFallbackReply(userMessage) }
    }

    return { usedFallback: false, reply: content }
  } catch (error) {
    console.error('[ai-assistant]', error)
    return { usedFallback: true, reply: buildFallbackReply(userMessage) }
  }
}

function buildFallbackReply(userMessage: string): string {
  const topic = userMessage.slice(0, 120)
  return `Thanks for your question about "${topic}${userMessage.length > 120 ? '…' : ''}".

I'm running in guided mode (set OPENAI_API_KEY on the server for full AI responses). Meanwhile:

1. **Search the engineer community** — another member may have solved a similar PLC, electrical, or embedded issue.
2. **Open a support ticket** — paid plans include engineer review with SLA.
3. **Safety first** — for live electrical work or locked-out machinery, follow site procedures and local standards.

Common next steps for troubleshooting:
- Confirm supply voltage and earthing
- Check error/fault codes on the drive or PLC
- Verify I/O wiring against the schematic
- Test inputs/outputs one at a time

Would you like to share error codes, photos, or ladder logic snippets in the community discussion?`
}
