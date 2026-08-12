/**
 * Seeded PRNG for screening randomization (deterministic per session seed).
 * Pure — no DB.
 */

export function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function createSeededRng(seed: string): () => number {
  let state = hashSeed(seed) || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

export function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const rng = createSeededRng(seed)
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function pickRandomSubset<T>(items: T[], count: number, seed: string): T[] {
  if (count <= 0) return []
  if (count >= items.length) return shuffleWithSeed(items, seed)
  return shuffleWithSeed(items, seed).slice(0, count)
}

export function randomInRange(
  rng: () => number,
  min: number,
  max: number,
  decimals = 0
): number {
  const raw = min + rng() * (max - min)
  if (decimals <= 0) return Math.round(raw)
  const factor = 10 ** decimals
  return Math.round(raw * factor) / factor
}
