/** Pure calculation helpers for student engineering tools. */

export function ohmsLawFromTwo(
  v: number | null,
  i: number | null,
  r: number | null
): { v: number; i: number; r: number; p: number } | null {
  const vals = [v, i, r].filter((x) => x != null && x > 0) as number[]
  if (vals.length < 2) return null

  let voltage = v ?? 0
  let current = i ?? 0
  let resistance = r ?? 0

  if (v != null && v > 0 && i != null && i > 0) {
    resistance = v / i
  } else if (v != null && v > 0 && r != null && r > 0) {
    current = v / r
  } else if (i != null && i > 0 && r != null && r > 0) {
    voltage = i * r
  } else {
    return null
  }

  return { v: voltage, i: current, r: resistance, p: voltage * current }
}

/** Three-phase active power (W) from line voltage, line current, power factor. */
export function threePhasePowerW(lineVoltage: number, lineCurrent: number, powerFactor: number) {
  if (lineVoltage <= 0 || lineCurrent <= 0 || powerFactor <= 0 || powerFactor > 1) return null
  const p = Math.sqrt(3) * lineVoltage * lineCurrent * powerFactor
  const s = Math.sqrt(3) * lineVoltage * lineCurrent
  const q = Math.sqrt(Math.max(0, s * s - p * p))
  return { p, s, q, pf: powerFactor }
}

/** Single-phase voltage drop: VD = 2 × ρ × L × I / A (ρ in Ω·mm²/m). */
export function voltageDropSinglePhase(params: {
  currentA: number
  lengthM: number
  crossSectionMm2: number
  resistivity?: number
  supplyVoltage?: number
}) {
  const rho = params.resistivity ?? 0.0175 // copper Ω·mm²/m at ~20°C
  const { currentA, lengthM, crossSectionMm2 } = params
  if (currentA <= 0 || lengthM <= 0 || crossSectionMm2 <= 0) return null

  const rPerM = (2 * rho) / crossSectionMm2
  const dropV = rPerM * lengthM * currentA
  const supply = params.supplyVoltage ?? 230
  const dropPercent = (dropV / supply) * 100

  return { dropV, dropPercent, resistanceOhm: rPerM * lengthM }
}

/** Estimate motor full-load current (A) — 3-phase. */
export function motorFlcKw(
  powerKw: number,
  lineVoltage: number,
  efficiency: number,
  powerFactor: number
) {
  if (powerKw <= 0 || lineVoltage <= 0 || efficiency <= 0 || powerFactor <= 0) return null
  const flc = (powerKw * 1000) / (Math.sqrt(3) * lineVoltage * efficiency * powerFactor)
  const flcWithMargin = flc * 1.25
  return { flc, flcWithMargin, hp: powerKw / 0.746 }
}

export function kwToHp(kw: number) {
  if (kw < 0) return null
  return { hp: kw / 0.746, kw }
}

export function hpToKw(hp: number) {
  if (hp < 0) return null
  return { kw: hp * 0.746, hp }
}

/** kVAR needed to correct from current PF to target PF. */
export function powerFactorCorrection(params: {
  realPowerKw: number
  currentPf: number
  targetPf: number
}) {
  const { realPowerKw, currentPf, targetPf } = params
  if (realPowerKw <= 0 || currentPf <= 0 || currentPf > 1 || targetPf <= 0 || targetPf > 1) {
    return null
  }
  const kvar =
    realPowerKw * (Math.tan(Math.acos(currentPf)) - Math.tan(Math.acos(targetPf)))
  return { kvar: Math.max(0, kvar) }
}

/** Voltage divider: Vout from Vin, R1, R2. */
export function voltageDivider(vin: number, r1: number, r2: number) {
  if (vin <= 0 || r1 <= 0 || r2 <= 0) return null
  const vout = vin * (r2 / (r1 + r2))
  return { vout, ratio: vout / vin }
}

/** PWM: duty cycle % from on-time and period (µs or same units). */
export function pwmDutyCycle(onTime: number, period: number) {
  if (onTime < 0 || period <= 0 || onTime > period) return null
  const dutyPercent = (onTime / period) * 100
  const frequencyHz = 1_000_000 / period // if inputs in µs
  return { dutyPercent, frequencyHz }
}

const COLOR_BANDS: Record<string, number> = {
  black: 0,
  brown: 1,
  red: 2,
  orange: 3,
  yellow: 4,
  green: 5,
  blue: 6,
  violet: 7,
  grey: 8,
  gray: 8,
  white: 9,
}

const MULTIPLIERS: Record<string, number> = {
  black: 1,
  brown: 10,
  red: 100,
  orange: 1000,
  yellow: 10000,
  green: 100000,
  blue: 1000000,
  violet: 10000000,
  grey: 100000000,
  gray: 100000000,
  gold: 0.1,
  silver: 0.01,
}

const TOLERANCES: Record<string, string> = {
  brown: '±1%',
  red: '±2%',
  green: '±0.5%',
  blue: '±0.25%',
  violet: '±0.1%',
  grey: '±0.05%',
  gray: '±0.05%',
  gold: '±5%',
  silver: '±10%',
}

export function decodeResistor4Band(bands: [string, string, string, string]) {
  const [b1, b2, b3, b4] = bands.map((b) => b.toLowerCase().trim())
  const d1 = COLOR_BANDS[b1]
  const d2 = COLOR_BANDS[b2]
  const mult = MULTIPLIERS[b3]
  if (d1 == null || d2 == null || mult == null) return null

  const ohms = (d1 * 10 + d2) * mult
  const tolerance = TOLERANCES[b4] ?? '—'
  const label =
    ohms >= 1_000_000
      ? `${(ohms / 1_000_000).toFixed(2)} MΩ`
      : ohms >= 1000
        ? `${(ohms / 1000).toFixed(2)} kΩ`
        : `${ohms} Ω`

  return { ohms, label, tolerance }
}

/** Simplified copper cable ampacity (approximate, ambient ~30°C, PVC). */
const CABLE_AMPACITY_MM2: { mm2: number; amps: number }[] = [
  { mm2: 1.5, amps: 16 },
  { mm2: 2.5, amps: 22 },
  { mm2: 4, amps: 28 },
  { mm2: 6, amps: 36 },
  { mm2: 10, amps: 50 },
  { mm2: 16, amps: 68 },
  { mm2: 25, amps: 89 },
  { mm2: 35, amps: 110 },
  { mm2: 50, amps: 134 },
  { mm2: 70, amps: 171 },
  { mm2: 95, amps: 207 },
]

export function suggestCableSize(loadAmps: number) {
  if (loadAmps <= 0) return null
  const design = loadAmps * 1.25
  const match = CABLE_AMPACITY_MM2.find((row) => row.amps >= design)
  return {
    designAmps: design,
    suggestedMm2: match?.mm2 ?? null,
    ampacity: match?.amps ?? null,
    note: match
      ? null
      : 'Load exceeds table — consult IEC/NEC tables or an engineer for sizing.',
  }
}

/** Single-phase real power (W). */
export function singlePhasePowerW(voltage: number, current: number, powerFactor = 1) {
  if (voltage <= 0 || current <= 0 || powerFactor <= 0 || powerFactor > 1) return null
  const p = voltage * current * powerFactor
  const s = voltage * current
  const q = Math.sqrt(Math.max(0, s * s - p * p))
  return { p, s, q, pf: powerFactor }
}

/** LED series resistor (Ω) and power dissipation. */
export function ledSeriesResistor(supplyV: number, forwardV: number, forwardMa: number) {
  if (supplyV <= forwardV || forwardMa <= 0) return null
  const i = forwardMa / 1000
  const r = (supplyV - forwardV) / i
  const p = i * i * r
  return { ohms: r, powerW: p, currentMa: forwardMa }
}

/** 3-phase wye: convert line ↔ phase voltage. */
export function threePhaseVoltageConvert(mode: 'lineToPhase' | 'phaseToLine', value: number) {
  if (value <= 0) return null
  if (mode === 'lineToPhase') return { result: value / Math.sqrt(3), input: value, outputLabel: 'phase' }
  return { result: value * Math.sqrt(3), input: value, outputLabel: 'line' }
}

/** Transformer secondary current from kVA rating. */
export function transformerSecondaryCurrent(kva: number, secondaryV: number, phases: 1 | 3 = 3) {
  if (kva <= 0 || secondaryV <= 0) return null
  const va = kva * 1000
  const current = phases === 3 ? va / (Math.sqrt(3) * secondaryV) : va / secondaryV
  return { currentA: current, phases }
}

/** Rough solar array sizing. */
export function solarPanelSizing(params: {
  dailyKwh: number
  panelW: number
  peakSunHours: number
  systemEfficiency?: number
}) {
  const { dailyKwh, panelW, peakSunHours } = params
  const eff = params.systemEfficiency ?? 0.8
  if (dailyKwh <= 0 || panelW <= 0 || peakSunHours <= 0 || eff <= 0) return null
  const dailyWh = dailyKwh * 1000
  const energyPerPanelWh = panelW * peakSunHours * eff
  const panels = Math.ceil(dailyWh / energyPerPanelWh)
  const arrayKw = (panels * panelW) / 1000
  return { panels, arrayKw, energyPerPanelWh }
}

/** PLC timer real delay: preset × time base (ms). */
export function plcTimerDelay(preset: number, timeBaseMs: number) {
  if (preset <= 0 || timeBaseMs <= 0) return null
  const delayMs = preset * timeBaseMs
  return { delayMs, delaySec: delayMs / 1000 }
}

export function celsiusToFahrenheit(c: number) {
  return { c, f: (c * 9) / 5 + 32 }
}

export function fahrenheitToCelsius(f: number) {
  return { f, c: ((f - 32) * 5) / 9 }
}

/** Simplified conduit fill — round conductors, single wire size. */
const CONDUIT_AREA_MM2: Record<string, number> = {
  '16': 153.9,
  '20': 254.5,
  '25': 353.0,
  '32': 572.6,
  '40': 883.6,
}

const WIRE_AREA_MM2: Record<number, number> = {
  1.5: 1.77,
  2.5: 2.98,
  4: 4.89,
  6: 7.45,
  10: 12.4,
  16: 19.2,
}

export function conduitFillPercent(conduitMm: string, wireMm2: number, conductorCount: number) {
  const conduitArea = CONDUIT_AREA_MM2[conduitMm]
  const wireArea = WIRE_AREA_MM2[wireMm2]
  if (!conduitArea || !wireArea || conductorCount <= 0) return null
  const fill = ((wireArea * conductorCount) / conduitArea) * 100
  return {
    fillPercent: fill,
    ok: fill <= 40,
    note: fill > 40 ? 'Above 40% fill — reduce conductors or upsize conduit.' : null,
  }
}
