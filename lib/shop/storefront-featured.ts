const INVALID_FEATURED_MESSAGE = 'Invalid featured flag'

export function parseStorefrontFeaturedFlag(
  raw: unknown
): { ok: true; value: boolean } | { ok: false; error: string } {
  if (typeof raw === 'boolean') return { ok: true, value: raw }
  if (raw === 1 || raw === '1' || raw === 'true') return { ok: true, value: true }
  if (raw === 0 || raw === '0' || raw === 'false') return { ok: true, value: false }
  return { ok: false, error: INVALID_FEATURED_MESSAGE }
}

/**
 * Create defaults to false. Update with neither field leaves is_featured untouched.
 */
export function applyStorefrontFeaturedToProductPayload(
  body: Record<string, unknown>,
  mode: 'create' | 'update'
):
  | { ok: true; payload: Record<string, unknown>; wroteFeatured: boolean }
  | { ok: false; error: string } {
  const rest = { ...body }
  delete rest.isFeatured
  delete rest.is_featured

  const raw = body.isFeatured ?? body.is_featured
  if (mode === 'update' && raw === undefined) {
    return { ok: true, payload: rest, wroteFeatured: false }
  }
  if (raw === undefined) {
    return { ok: true, payload: { ...rest, is_featured: false }, wroteFeatured: true }
  }

  const parsed = parseStorefrontFeaturedFlag(raw)
  if (!parsed.ok) return parsed
  return {
    ok: true,
    wroteFeatured: true,
    payload: { ...rest, is_featured: parsed.value },
  }
}
