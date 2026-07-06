import { Cpu, Plug, Sun, Zap, type LucideIcon } from 'lucide-react'

/** Shared between the client tools panel and server-rendered home section. */
export const ENGINEERING_TOOL_CATEGORIES: {
  id: string
  title: string
  icon: LucideIcon
  summary: string
}[] = [
  {
    id: 'electrical',
    title: 'Electrical',
    icon: Zap,
    summary:
      "Ohm's law, single- and three-phase power, line/phase voltage, transformers, PF correction, and kW↔HP.",
  },
  {
    id: 'installation',
    title: 'Installation',
    icon: Plug,
    summary: 'Voltage drop, motor FLC, cable sizing, and conduit fill — for field wiring checks.',
  },
  {
    id: 'embedded',
    title: 'Embedded',
    icon: Cpu,
    summary: 'Resistor color codes, LED resistors, voltage dividers, and PWM duty cycle.',
  },
  {
    id: 'solar',
    title: 'Solar & PLC',
    icon: Sun,
    summary: 'Solar panel array sizing, PLC timer delays, and temperature conversion.',
  },
]
