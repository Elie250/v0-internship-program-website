/**
 * Recruitment AI provider abstraction.
 * Reuses the project's existing OpenAI env configuration (OPENAI_API_KEY / OPENAI_MODEL).
 * No browser exposure of credentials.
 */

export type RecruitmentAiMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type RecruitmentAiCompletion = {
  ok: boolean
  content?: string
  model: string
  provider: string
  usedFallback: boolean
  error?: string
}

export function getRecruitmentAiConfig(): {
  enabled: boolean
  provider: string
  model: string
  hasApiKey: boolean
} {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  return {
    enabled: Boolean(apiKey),
    provider: 'openai',
    model,
    hasApiKey: Boolean(apiKey),
  }
}

/** Server-side only. Never import from client components. */
export async function completeRecruitmentAi(
  messages: RecruitmentAiMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<RecruitmentAiCompletion> {
  const config = getRecruitmentAiConfig()
  if (!config.hasApiKey) {
    return {
      ok: false,
      usedFallback: true,
      provider: config.provider,
      model: config.model,
      error: 'AI provider not configured (OPENAI_API_KEY missing)',
    }
  }

  const apiKey = process.env.OPENAI_API_KEY!.trim()

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: options?.maxTokens ?? 1200,
        temperature: options?.temperature ?? 0.2,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[recruitment-ai] provider error', res.status, errText.slice(0, 300))
      return {
        ok: false,
        usedFallback: true,
        provider: config.provider,
        model: config.model,
        error: `Provider error (${res.status})`,
      }
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      model?: string
    }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return {
        ok: false,
        usedFallback: true,
        provider: config.provider,
        model: data.model || config.model,
        error: 'Empty provider response',
      }
    }

    return {
      ok: true,
      content,
      provider: config.provider,
      model: data.model || config.model,
      usedFallback: false,
    }
  } catch (error) {
    console.error('[recruitment-ai]', error)
    return {
      ok: false,
      usedFallback: true,
      provider: config.provider,
      model: config.model,
      error: 'Provider request failed',
    }
  }
}

/** Credentials must never be serialized to the browser. */
export function publicAiStatus() {
  const config = getRecruitmentAiConfig()
  return {
    available: config.enabled,
    provider: config.provider,
    model: config.enabled ? config.model : null,
    // Never include apiKey
  }
}
