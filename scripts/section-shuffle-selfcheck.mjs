import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(root, 'components/home/section-shuffle-slots.tsx'), 'utf8')

function visibleSlotItemIndex(baseIndex, slotIndex, itemCount) {
  if (itemCount <= 0) return 0
  return (((baseIndex % itemCount) + slotIndex) % itemCount + itemCount) % itemCount
}

function visibleIds(items, baseIndex, slotCount) {
  const count = Math.min(slotCount, Math.max(items.length, 1))
  if (items.length === 0) return []
  return Array.from({ length: count }, (_, slotIndex) => {
    return items[visibleSlotItemIndex(baseIndex, slotIndex, items.length)]
  })
}

test('source uses one shared interval and offset formula', () => {
  assert.equal([...src.matchAll(/setInterval/g)].length, 1)
  assert.equal([...src.matchAll(/staggerMs/g)].length, 0)
  assert.match(src, /visibleSlotItemIndex\(baseIndex, slotIndex, itemCount\)/)
  assert.match(src, /prefers-reduced-motion/)
  assert.doesNotMatch(src, /embla/i)
})

test('empty and single collections stay safe', () => {
  assert.deepEqual(visibleIds([], 0, 3), [])
  assert.deepEqual(visibleIds(['A'], 0, 3), ['A'])
  assert.deepEqual(visibleIds(['A'], 4, 3), ['A'])
})

test('two items never share a visible slot', () => {
  const items = ['A', 'B']
  for (const base of [0, 1, 2, 5]) {
    const shown = visibleIds(items, base, 3)
    assert.equal(shown.length, 2)
    assert.equal(new Set(shown).size, shown.length)
  }
})

test('three or more items stay unique across a full rotation', () => {
  const items = ['A', 'B', 'C', 'D']
  for (let base = 0; base < items.length; base += 1) {
    const shown = visibleIds(items, base, 3)
    assert.equal(shown.length, 3)
    assert.equal(new Set(shown).size, 3, `duplicate visible slots at base ${base}: ${shown.join(',')}`)
  }
})
