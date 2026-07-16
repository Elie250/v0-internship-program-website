/** Calculator folders + tool index for the professional browse UI. */

export type CalculatorFolderId = 'electrical' | 'installation' | 'embedded' | 'solar'

export type CalculatorToolMeta = {
  id: string
  folderId: CalculatorFolderId
  title: string
  blurb: string
}

export const CALCULATOR_FOLDERS: {
  id: CalculatorFolderId
  title: string
  summary: string
  accent: string
}[] = [
  {
    id: 'electrical',
    title: 'Power & circuits',
    summary: 'Ohm’s law, single/three-phase power, transformers, PF, and unit conversions.',
    accent: '#1d4ed8',
  },
  {
    id: 'installation',
    title: 'Wiring & cables',
    summary: 'Wire sizing, voltage drop, motor FLC, AWG↔mm², and conduit fill for field work.',
    accent: '#0f766e',
  },
  {
    id: 'embedded',
    title: 'Electronics & embedded',
    summary: 'Resistors, LED drivers, dividers, PWM, RC timing, and frequency helpers.',
    accent: '#7c3aed',
  },
  {
    id: 'solar',
    title: 'Solar, PLC & energy',
    summary: 'Solar arrays, battery autonomy, energy cost, PLC timers, and temperature.',
    accent: '#b45309',
  },
]

export const CALCULATOR_TOOLS: CalculatorToolMeta[] = [
  // Power & circuits
  { id: 'ohms-law', folderId: 'electrical', title: "Ohm's law & power", blurb: 'Solve V, I, R, and P from any two values.' },
  { id: 'single-phase', folderId: 'electrical', title: 'Single-phase power', blurb: 'P, S, Q from voltage, current, and PF.' },
  { id: 'three-phase', folderId: 'electrical', title: 'Three-phase power', blurb: 'Active, apparent, and reactive power.' },
  { id: 'line-phase', folderId: 'electrical', title: 'Line ↔ phase voltage', blurb: 'Wye conversions for balanced systems.' },
  { id: 'star-delta', folderId: 'electrical', title: 'Star ↔ delta', blurb: 'Balanced star/delta voltage relations.' },
  { id: 'transformer', folderId: 'electrical', title: 'Transformer current', blurb: 'Secondary current from kVA rating.' },
  { id: 'pf-correction', folderId: 'electrical', title: 'PF correction', blurb: 'kVAR needed to reach a target PF.' },
  { id: 'reactive-power', folderId: 'electrical', title: 'Reactive power (Q)', blurb: 'kVAR from kW and power factor.' },
  { id: 'kw-hp', folderId: 'electrical', title: 'kW ↔ HP', blurb: 'Mechanical / electrical power units.' },

  // Wiring & cables
  { id: 'wire-sizing', folderId: 'installation', title: 'Wire sizing (load + drop)', blurb: 'Size copper cable for ampacity and % drop.' },
  { id: 'cable-ampacity', folderId: 'installation', title: 'Cable ampacity helper', blurb: 'Quick mm² suggestion from load amps.' },
  { id: 'voltage-drop-1ph', folderId: 'installation', title: 'Voltage drop (1φ)', blurb: 'Single-phase drop along a run.' },
  { id: 'voltage-drop-3ph', folderId: 'installation', title: 'Voltage drop (3φ)', blurb: 'Three-phase line drop estimate.' },
  { id: 'awg-mm2', folderId: 'installation', title: 'AWG ↔ mm²', blurb: 'Nearest wire gauge conversions.' },
  { id: 'motor-flc', folderId: 'installation', title: 'Motor full-load current', blurb: '3-phase FLC and 125% margin.' },
  { id: 'conduit-fill', folderId: 'installation', title: 'Conduit fill', blurb: 'Rough fill % for same-size conductors.' },

  // Electronics
  { id: 'resistor-color', folderId: 'embedded', title: '4-band resistor decoder', blurb: 'Read resistance from color bands.' },
  { id: 'led-resistor', folderId: 'embedded', title: 'LED series resistor', blurb: 'Current-limit resistor and wattage.' },
  { id: 'voltage-divider', folderId: 'embedded', title: 'Voltage divider', blurb: 'Vout from Vin, R1, R2.' },
  { id: 'pwm', folderId: 'embedded', title: 'PWM duty cycle', blurb: 'Duty % and frequency from timing.' },
  { id: 'rc-time', folderId: 'embedded', title: 'RC time constant', blurb: 'τ = R×C and ~5τ settle time.' },
  { id: 'frequency-period', folderId: 'embedded', title: 'Frequency ↔ period', blurb: 'Convert Hz and seconds/ms.' },

  // Solar / PLC / energy
  { id: 'solar-sizing', folderId: 'solar', title: 'Solar array sizing', blurb: 'Panels needed for daily kWh.' },
  { id: 'battery-ah', folderId: 'solar', title: 'Battery autonomy (Ah)', blurb: 'Bank size for hours of DC load.' },
  { id: 'energy-cost', folderId: 'solar', title: 'Energy cost estimate', blurb: 'Monthly/yearly cost from kW and tariff.' },
  { id: 'plc-timer', folderId: 'solar', title: 'PLC timer delay', blurb: 'Preset × time base → real delay.' },
  { id: 'temperature', folderId: 'solar', title: 'Temperature converter', blurb: '°C ↔ °F for field notes.' },
]

export function toolsInFolder(folderId: CalculatorFolderId): CalculatorToolMeta[] {
  return CALCULATOR_TOOLS.filter((t) => t.folderId === folderId)
}

export function findCalculatorTool(id: string): CalculatorToolMeta | undefined {
  return CALCULATOR_TOOLS.find((t) => t.id === id)
}

export function findFolder(id: string) {
  return CALCULATOR_FOLDERS.find((f) => f.id === id)
}
