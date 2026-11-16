import katex from 'katex'

export const MAX_MATH_LATEX = 2000

export type MathRenderResult =
  | { ok: true; html: string }
  | { ok: false; error: string }

/**
 * Safe KaTeX render for lesson math blocks.
 * trust:false — no HTML/trust commands; throwOnError:false — never crash the lesson shell.
 */
export function renderLessonMath(
  latex: string,
  displayMode: boolean
): MathRenderResult {
  const trimmed = String(latex ?? '').trim()
  if (!trimmed) return { ok: false, error: 'Enter a LaTeX expression.' }
  if (trimmed.length > MAX_MATH_LATEX) {
    return { ok: false, error: `Expression cannot exceed ${MAX_MATH_LATEX} characters.` }
  }

  try {
    const html = katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      trust: false,
      strict: 'ignore',
      maxSize: 20,
      maxExpand: 500,
      output: 'html',
    })
    if (!html.trim()) return { ok: false, error: 'Could not render this expression.' }
    return { ok: true, html }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid expression'
    return { ok: false, error: message }
  }
}
