/**
 * Curated code-block language options for PLC / industrial teaching.
 * Unknown historical values are preserved as-is (never silently remapped to "text").
 */

export const CURATED_CODE_LANGUAGES = [
  { value: 'text', label: 'Plain text' },
  { value: 'st', label: 'Structured Text (ST)' },
  { value: 'iecst', label: 'IEC Structured Text' },
  { value: 'ladder', label: 'Ladder Logic' },
  { value: 'python', label: 'Python' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
] as const

export type CuratedCodeLanguage = (typeof CURATED_CODE_LANGUAGES)[number]['value']

const LABEL_BY_VALUE = new Map<string, string>(
  CURATED_CODE_LANGUAGES.map((row) => [row.value, row.label])
)

/** Human-readable label; unknown historical values are shown as-is. */
export function codeLanguageLabel(language: string | null | undefined): string {
  const raw = String(language ?? '').trim() || 'text'
  return LABEL_BY_VALUE.get(raw) ?? raw
}

/** Options for the authoring select, including a preserved unknown historical value. */
export function codeLanguageSelectOptions(current: string | null | undefined): Array<{
  value: string
  label: string
}> {
  const raw = String(current ?? '').trim() || 'text'
  const options: Array<{ value: string; label: string }> = CURATED_CODE_LANGUAGES.map((row) => ({
    value: row.value,
    label: row.label,
  }))
  if (!LABEL_BY_VALUE.has(raw)) {
    options.unshift({ value: raw, label: `${raw} (existing)` })
  }
  return options
}
