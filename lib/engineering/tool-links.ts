/** Maps Field Notes tags to public engineering calculator sections. */
export const ARTICLE_TAG_TOOL_LINKS: Record<
  string,
  { label: string; href: string; description: string }
> = {
  electrical: {
    label: 'Electrical calculators',
    href: '/tools#electrical',
    description: "Ohm's law, three-phase power, power factor, and motor HP conversions.",
  },
  plc: {
    label: 'Solar & PLC tools',
    href: '/tools#solar',
    description: 'PLC timer delays and solar array sizing helpers.',
  },
  embedded: {
    label: 'Embedded calculators',
    href: '/tools#embedded',
    description: 'Resistor codes, LED resistors, voltage dividers, and PWM duty.',
  },
  solar: {
    label: 'Solar sizing tools',
    href: '/tools#solar',
    description: 'Panel array sizing and related field checks.',
  },
  tools: {
    label: 'All engineering tools',
    href: '/tools',
    description: 'Browse every calculator on the public tools page.',
  },
  'field-fix': {
    label: 'Installation tools',
    href: '/tools#installation',
    description: 'Voltage drop, cable sizing, motor FLC, and conduit fill.',
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
