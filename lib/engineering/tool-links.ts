/** Maps Field Notes tags to public engineering calculator sections. */
export const ARTICLE_TAG_TOOL_LINKS: Record<
  string,
  { label: string; href: string; description: string }
> = {
  electrical: {
    label: 'Power & circuits',
    href: '/tools/calculators#electrical',
    description: "Ohm's law, three-phase power, PF correction, and star/delta helpers.",
  },
  plc: {
    label: 'Solar, PLC & energy',
    href: '/tools/calculators#solar',
    description: 'PLC timers, solar sizing, battery Ah, and energy cost.',
  },
  embedded: {
    label: 'Electronics & embedded',
    href: '/tools/calculators#embedded',
    description: 'Resistor codes, LED resistors, PWM, RC timing, and frequency.',
  },
  solar: {
    label: 'Solar & energy tools',
    href: '/tools/calculators#solar',
    description: 'Panel array sizing, battery autonomy, and tariff cost estimates.',
  },
  tools: {
    label: 'All engineering tools',
    href: '/tools',
    description: 'Browse calculator folders on the public tools page.',
  },
  'field-work': {
    label: 'Wiring & cables',
    href: '/tools/calculators#installation',
    description: 'Wire sizing, voltage drop, AWG↔mm², motor FLC, and conduit fill.',
  },
}

export function relatedToolsForTags(tags: string[]) {
  const seen = new Set<string>()
  const items: Array<{ label: string; href: string; description: string }> = []
  for (const tag of tags) {
    const key = tag.toLowerCase()
    const link = ARTICLE_TAG_TOOL_LINKS[key]
    if (!link || seen.has(link.href)) continue
    seen.add(link.href)
    items.push(link)
  }
  if (items.length === 0) {
    items.push(ARTICLE_TAG_TOOL_LINKS.tools)
  }
  return items
}
