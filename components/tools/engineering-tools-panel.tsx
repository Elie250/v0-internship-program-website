'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  celsiusToFahrenheit,
  conduitFillPercent,
  decodeResistor4Band,
  fahrenheitToCelsius,
  kwToHp,
  ledSeriesResistor,
  motorFlcKw,
  ohmsLawFromTwo,
  plcTimerDelay,
  powerFactorCorrection,
  pwmDutyCycle,
  singlePhasePowerW,
  solarPanelSizing,
  suggestCableSize,
  threePhasePowerW,
  threePhaseVoltageConvert,
  transformerSecondaryCurrent,
  voltageDivider,
  voltageDropSinglePhase,
} from '@/lib/engineering/calculators'
import { cn } from '@/lib/utils'
import { Calculator, Cpu, Plug, Sun, Zap, type LucideIcon } from 'lucide-react'

function NumField({
  id,
  label,
  value,
  onChange,
  unit,
  step = 'any',
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  unit?: string
  step?: string
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <Input
          id={id}
          type="number"
          step={step}
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit ? <span className="text-sm text-slate-500 shrink-0 w-10">{unit}</span> : null}
      </div>
    </div>
  )
}

function ResultBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-slate-900 space-y-1">
      {children}
    </div>
  )
}

function OhmsLawTool() {
  const [v, setV] = useState('')
  const [i, setI] = useState('')
  const [r, setR] = useState('')

  const result = useMemo(() => {
    const parse = (s: string) => (s.trim() ? Number(s) : null)
    return ohmsLawFromTwo(parse(v), parse(i), parse(r))
  }, [v, i, r])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Ohm&apos;s law &amp; power</CardTitle>
        <CardDescription>Enter any two values (V, I, or R) to solve the circuit.</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-3 gap-4">
        <NumField id="ohm-v" label="Voltage" value={v} onChange={setV} unit="V" />
        <NumField id="ohm-i" label="Current" value={i} onChange={setI} unit="A" />
        <NumField id="ohm-r" label="Resistance" value={r} onChange={setR} unit="Ω" />
        {result ? (
          <div className="sm:col-span-3">
            <ResultBox>
              <p>
                <strong>V</strong> = {result.v.toFixed(3)} V · <strong>I</strong> ={' '}
                {result.i.toFixed(3)} A · <strong>R</strong> = {result.r.toFixed(3)} Ω
              </p>
              <p>
                <strong>P</strong> = {result.p.toFixed(3)} W ({(result.p / 1000).toFixed(4)} kW)
              </p>
            </ResultBox>
          </div>
        ) : (
          <p className="sm:col-span-3 text-xs text-slate-500">Enter at least two positive values.</p>
        )}
      </CardContent>
    </Card>
  )
}

function SinglePhaseTool() {
  const [v, setV] = useState('230')
  const [i, setI] = useState('')
  const [pf, setPf] = useState('1')

  const result = useMemo(() => {
    const lv = Number(v)
    const li = Number(i)
    const lpf = Number(pf)
    if (!li || li <= 0) return null
    return singlePhasePowerW(lv, li, lpf)
  }, [v, i, pf])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Single-phase power</CardTitle>
        <CardDescription>P = V × I × cos φ</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-3 gap-4">
        <NumField id="1ph-v" label="Voltage" value={v} onChange={setV} unit="V" />
        <NumField id="1ph-i" label="Current" value={i} onChange={setI} unit="A" />
        <NumField id="1ph-pf" label="Power factor" value={pf} onChange={setPf} step="0.01" />
        {result ? (
          <div className="sm:col-span-3">
            <ResultBox>
              <p>
                <strong>P</strong> = {(result.p / 1000).toFixed(2)} kW ({result.p.toFixed(0)} W)
              </p>
              <p>
                <strong>S</strong> = {(result.s / 1000).toFixed(2)} kVA · <strong>Q</strong> ={' '}
                {(result.q / 1000).toFixed(2)} kVAR
              </p>
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ThreePhaseTool() {
  const [v, setV] = useState('400')
  const [i, setI] = useState('')
  const [pf, setPf] = useState('0.85')

  const result = useMemo(() => {
    const lv = Number(v)
    const li = Number(i)
    const lpf = Number(pf)
    if (!li || li <= 0) return null
    return threePhasePowerW(lv, li, lpf)
  }, [v, i, pf])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Three-phase power</CardTitle>
        <CardDescription>P = √3 × V<sub>L</sub> × I<sub>L</sub> × cos φ</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-3 gap-4">
        <NumField id="3ph-v" label="Line voltage" value={v} onChange={setV} unit="V" />
        <NumField id="3ph-i" label="Line current" value={i} onChange={setI} unit="A" />
        <NumField id="3ph-pf" label="Power factor" value={pf} onChange={setPf} step="0.01" />
        {result ? (
          <div className="sm:col-span-3">
            <ResultBox>
              <p>
                <strong>P</strong> = {(result.p / 1000).toFixed(2)} kW ({result.p.toFixed(0)} W)
              </p>
              <p>
                <strong>S</strong> = {(result.s / 1000).toFixed(2)} kVA · <strong>Q</strong> ={' '}
                {(result.q / 1000).toFixed(2)} kVAR
              </p>
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function LinePhaseTool() {
  const [mode, setMode] = useState<'lineToPhase' | 'phaseToLine'>('lineToPhase')
  const [value, setValue] = useState('400')

  const result = useMemo(() => {
    const v = Number(value)
    if (!v || v <= 0) return null
    return threePhaseVoltageConvert(mode, v)
  }, [mode, value])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Line ↔ phase voltage</CardTitle>
        <CardDescription>Wye (star) connection: V<sub>line</sub> = √3 × V<sub>phase</sub></CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Conversion</Label>
          <Select
            value={mode}
            onValueChange={(v: string) => setMode(v as 'lineToPhase' | 'phaseToLine')}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lineToPhase">Line → phase</SelectItem>
              <SelectItem value="phaseToLine">Phase → line</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <NumField
          id="lp-v"
          label={mode === 'lineToPhase' ? 'Line voltage' : 'Phase voltage'}
          value={value}
          onChange={setValue}
          unit="V"
        />
        {result ? (
          <div className="sm:col-span-2">
            <ResultBox>
              <p>
                <strong>{result.outputLabel} voltage</strong> = {result.result.toFixed(2)} V
              </p>
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function TransformerTool() {
  const [kva, setKva] = useState('')
  const [secondaryV, setSecondaryV] = useState('400')
  const [phases, setPhases] = useState<'1' | '3'>('3')

  const result = useMemo(() => {
    const k = Number(kva)
    const v = Number(secondaryV)
    if (!k || !v) return null
    return transformerSecondaryCurrent(k, v, phases === '3' ? 3 : 1)
  }, [kva, secondaryV, phases])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Transformer secondary current</CardTitle>
        <CardDescription>Estimate secondary full-load current from kVA rating.</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-3 gap-4">
        <NumField id="xf-kva" label="Rating" value={kva} onChange={setKva} unit="kVA" />
        <NumField id="xf-v" label="Secondary voltage" value={secondaryV} onChange={setSecondaryV} unit="V" />
        <div>
          <Label>Phases</Label>
          <Select value={phases} onValueChange={(v: string) => setPhases(v as '1' | '3')}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Single-phase</SelectItem>
              <SelectItem value="3">Three-phase</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {result ? (
          <div className="sm:col-span-3">
            <ResultBox>
              <p>
                <strong>I<sub>secondary</sub></strong> ≈ {result.currentA.toFixed(2)} A ({result.phases}-phase)
              </p>
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function VoltageDropTool() {
  const [current, setCurrent] = useState('')
  const [length, setLength] = useState('')
  const [csa, setCsa] = useState('2.5')
  const [supply, setSupply] = useState('230')

  const result = useMemo(() => {
    const ia = Number(current)
    const lm = Number(length)
    const mm2 = Number(csa)
    const v = Number(supply)
    if (!ia || !lm || !mm2) return null
    return voltageDropSinglePhase({
      currentA: ia,
      lengthM: lm,
      crossSectionMm2: mm2,
      supplyVoltage: v,
    })
  }, [current, length, csa, supply])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Voltage drop (single-phase)</CardTitle>
        <CardDescription>Copper cable, round-trip length. Target &lt; 3–5% for branch circuits.</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <NumField id="vd-i" label="Load current" value={current} onChange={setCurrent} unit="A" />
        <NumField id="vd-l" label="Cable length (one way)" value={length} onChange={setLength} unit="m" />
        <NumField id="vd-csa" label="Cross-section" value={csa} onChange={setCsa} unit="mm²" />
        <NumField id="vd-supply" label="Supply voltage" value={supply} onChange={setSupply} unit="V" />
        {result ? (
          <div className="sm:col-span-2">
            <ResultBox>
              <p>
                <strong>Drop</strong> = {result.dropV.toFixed(2)} V ({result.dropPercent.toFixed(2)}%)
              </p>
              <p>
                <strong>R<sub>cable</sub></strong> ≈ {result.resistanceOhm.toFixed(3)} Ω
              </p>
              {result.dropPercent > 5 ? (
                <p className="text-amber-800 font-medium">Above 5% — consider a larger cable.</p>
              ) : null}
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function MotorFlcTool() {
  const [kw, setKw] = useState('')
  const [v, setV] = useState('400')
  const [eff, setEff] = useState('0.9')
  const [pf, setPf] = useState('0.85')

  const result = useMemo(() => {
    const pk = Number(kw)
    if (!pk) return null
    return motorFlcKw(pk, Number(v), Number(eff), Number(pf))
  }, [kw, v, eff, pf])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Motor full-load current</CardTitle>
        <CardDescription>Estimate FLC and 125% value for breaker/overload sizing.</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <NumField id="mflc-kw" label="Motor power" value={kw} onChange={setKw} unit="kW" />
        <NumField id="mflc-v" label="Line voltage" value={v} onChange={setV} unit="V" />
        <NumField id="mflc-eff" label="Efficiency" value={eff} onChange={setEff} step="0.01" />
        <NumField id="mflc-pf" label="Power factor" value={pf} onChange={setPf} step="0.01" />
        {result ? (
          <div className="sm:col-span-2">
            <ResultBox>
              <p>
                <strong>FLC</strong> ≈ {result.flc.toFixed(2)} A · <strong>125%</strong> ={' '}
                {result.flcWithMargin.toFixed(2)} A
              </p>
              <p>≈ {result.hp.toFixed(2)} HP</p>
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function CableSizeTool() {
  const [amps, setAmps] = useState('')

  const result = useMemo(() => {
    const a = Number(amps)
    if (!a) return null
    return suggestCableSize(a)
  }, [amps])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Cable size helper</CardTitle>
        <CardDescription>
          Simplified copper PVC ampacity table (125% design factor). Verify with local code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NumField id="cable-a" label="Load current" value={amps} onChange={setAmps} unit="A" />
        {result ? (
          <ResultBox>
            {result.suggestedMm2 ? (
              <p>
                Suggested: <strong>{result.suggestedMm2} mm²</strong> (ampacity {result.ampacity} A,
                design {result.designAmps.toFixed(1)} A)
              </p>
            ) : (
              <p className="text-amber-800">{result.note}</p>
            )}
          </ResultBox>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ConduitFillTool() {
  const [conduit, setConduit] = useState('25')
  const [wire, setWire] = useState('2.5')
  const [count, setCount] = useState('3')

  const result = useMemo(() => {
    const n = Number(count)
    const w = Number(wire)
    if (!n || !w) return null
    return conduitFillPercent(conduit, w, n)
  }, [conduit, wire, count])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Conduit fill</CardTitle>
        <CardDescription>Round conductors, single wire size. Target ≤ 40% fill.</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label>Conduit size</Label>
          <Select value={conduit} onValueChange={setConduit}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['16', '20', '25', '32', '40'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s} mm
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Wire size</Label>
          <Select value={wire} onValueChange={setWire}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['1.5', '2.5', '4', '6', '10', '16'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s} mm²
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NumField id="cf-count" label="Conductors" value={count} onChange={setCount} step="1" />
        {result ? (
          <div className="sm:col-span-3">
            <ResultBox>
              <p>
                <strong>Fill</strong> = {result.fillPercent.toFixed(1)}%{' '}
                {result.ok ? (
                  <span className="text-green-800">(OK)</span>
                ) : (
                  <span className="text-amber-800 font-medium">(over 40%)</span>
                )}
              </p>
              {result.note ? <p className="text-amber-800">{result.note}</p> : null}
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function PfCorrectionTool() {
  const [kw, setKw] = useState('')
  const [pfNow, setPfNow] = useState('0.75')
  const [pfTarget, setPfTarget] = useState('0.95')

  const result = useMemo(() => {
    const pk = Number(kw)
    if (!pk) return null
    return powerFactorCorrection({
      realPowerKw: pk,
      currentPf: Number(pfNow),
      targetPf: Number(pfTarget),
    })
  }, [kw, pfNow, pfTarget])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Power-factor correction</CardTitle>
        <CardDescription>kVAR of capacitors needed to reach a target power factor.</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-3 gap-4">
        <NumField id="pfc-kw" label="Real power" value={kw} onChange={setKw} unit="kW" />
        <NumField id="pfc-now" label="Current PF" value={pfNow} onChange={setPfNow} step="0.01" />
        <NumField id="pfc-target" label="Target PF" value={pfTarget} onChange={setPfTarget} step="0.01" />
        {result ? (
          <div className="sm:col-span-3">
            <ResultBox>
              <p>
                <strong>Capacitor bank</strong> ≈ {result.kvar.toFixed(2)} kVAR
              </p>
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function UnitConverterTool() {
  const [kw, setKw] = useState('')

  const result = useMemo(() => {
    const k = Number(kw)
    if (Number.isNaN(k) || k < 0) return null
    return kwToHp(k)
  }, [kw])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">kW ↔ HP</CardTitle>
        <CardDescription>1 HP ≈ 0.746 kW</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NumField id="conv-kw" label="Kilowatts" value={kw} onChange={setKw} unit="kW" />
        {result ? (
          <ResultBox>
            <p>
              <strong>{result.kw}</strong> kW = <strong>{result.hp.toFixed(3)}</strong> HP
            </p>
          </ResultBox>
        ) : null}
      </CardContent>
    </Card>
  )
}

const RESISTOR_COLORS = [
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'grey',
  'white',
  'gold',
  'silver',
] as const

function ResistorColorTool() {
  const [b1, setB1] = useState('brown')
  const [b2, setB2] = useState('black')
  const [b3, setB3] = useState('red')
  const [b4, setB4] = useState('gold')

  const result = useMemo(
    () => decodeResistor4Band([b1, b2, b3, b4]),
    [b1, b2, b3, b4]
  )

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">4-band resistor decoder</CardTitle>
        <CardDescription>Read color bands left to right (tolerance band usually wider/gap).</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        {(
          [
            ['Digit 1', b1, setB1, false],
            ['Digit 2', b2, setB2, false],
            ['Multiplier', b3, setB3, true],
            ['Tolerance', b4, setB4, true],
          ] as const
        ).map(([label, val, setVal, allowMetal]) => (
          <div key={label}>
            <Label>{label}</Label>
            <Select value={val} onValueChange={setVal}>
              <SelectTrigger className="mt-1 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESISTOR_COLORS.filter((c) => allowMetal || (c !== 'gold' && c !== 'silver')).map(
                  (c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        ))}
        {result ? (
          <div className="sm:col-span-2">
            <ResultBox>
              <p>
                <strong>{result.label}</strong> ({result.ohms} Ω) {result.tolerance}
              </p>
            </ResultBox>
          </div>
        ) : (
          <p className="sm:col-span-2 text-xs text-red-700">Invalid band combination for digits/multiplier.</p>
        )}
      </CardContent>
    </Card>
  )
}

function LedResistorTool() {
  const [supply, setSupply] = useState('5')
  const [forwardV, setForwardV] = useState('2')
  const [forwardMa, setForwardMa] = useState('20')

  const result = useMemo(() => {
    const s = Number(supply)
    const fv = Number(forwardV)
    const ma = Number(forwardMa)
    if (!s || !fv || !ma) return null
    return ledSeriesResistor(s, fv, ma)
  }, [supply, forwardV, forwardMa])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">LED series resistor</CardTitle>
        <CardDescription>R = (V<sub>supply</sub> − V<sub>f</sub>) / I</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-3 gap-4">
        <NumField id="led-supply" label="Supply voltage" value={supply} onChange={setSupply} unit="V" />
        <NumField id="led-vf" label="Forward voltage" value={forwardV} onChange={setForwardV} unit="V" />
        <NumField id="led-ma" label="Forward current" value={forwardMa} onChange={setForwardMa} unit="mA" />
        {result ? (
          <div className="sm:col-span-3">
            <ResultBox>
              <p>
                <strong>R</strong> ≈ {result.ohms.toFixed(0)} Ω · <strong>P</strong> ≈{' '}
                {result.powerW.toFixed(3)} W
              </p>
              <p className="text-xs text-slate-600">
                Use next standard value ≥ calculated R; pick resistor wattage with margin.
              </p>
            </ResultBox>
          </div>
        ) : (
          <p className="sm:col-span-3 text-xs text-slate-500">
            Supply must be greater than forward voltage.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function VoltageDividerTool() {
  const [vin, setVin] = useState('5')
  const [r1, setR1] = useState('')
  const [r2, setR2] = useState('')

  const result = useMemo(() => {
    const v = Number(vin)
    const a = Number(r1)
    const b = Number(r2)
    if (!a || !b) return null
    return voltageDivider(v, a, b)
  }, [vin, r1, r2])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Voltage divider</CardTitle>
        <CardDescription>V<sub>out</sub> = V<sub>in</sub> × R2 / (R1 + R2)</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-3 gap-4">
        <NumField id="vdiv-in" label="Input voltage" value={vin} onChange={setVin} unit="V" />
        <NumField id="vdiv-r1" label="R1 (top)" value={r1} onChange={setR1} unit="Ω" />
        <NumField id="vdiv-r2" label="R2 (to GND)" value={r2} onChange={setR2} unit="Ω" />
        {result ? (
          <div className="sm:col-span-3">
            <ResultBox>
              <p>
                <strong>V<sub>out</sub></strong> = {result.vout.toFixed(4)} V (
                {(result.ratio * 100).toFixed(1)}%)
              </p>
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function PwmTool() {
  const [on, setOn] = useState('')
  const [period, setPeriod] = useState('')

  const result = useMemo(() => {
    const o = Number(on)
    const p = Number(period)
    if (!o || !p) return null
    return pwmDutyCycle(o, p)
  }, [on, period])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">PWM duty cycle</CardTitle>
        <CardDescription>On-time and period in microseconds (µs).</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <NumField id="pwm-on" label="On time" value={on} onChange={setOn} unit="µs" />
        <NumField id="pwm-period" label="Period" value={period} onChange={setPeriod} unit="µs" />
        {result ? (
          <div className="sm:col-span-2">
            <ResultBox>
              <p>
                <strong>Duty</strong> = {result.dutyPercent.toFixed(2)}% · <strong>f</strong> ≈{' '}
                {result.frequencyHz.toFixed(1)} Hz
              </p>
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SolarSizingTool() {
  const [dailyKwh, setDailyKwh] = useState('')
  const [panelW, setPanelW] = useState('400')
  const [sunHours, setSunHours] = useState('5')
  const [efficiency, setEfficiency] = useState('0.8')

  const result = useMemo(() => {
    const d = Number(dailyKwh)
    const p = Number(panelW)
    const h = Number(sunHours)
    const e = Number(efficiency)
    if (!d || !p || !h) return null
    return solarPanelSizing({
      dailyKwh: d,
      panelW: p,
      peakSunHours: h,
      systemEfficiency: e,
    })
  }, [dailyKwh, panelW, sunHours, efficiency])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Solar array sizing</CardTitle>
        <CardDescription>Estimate panel count from daily energy need and peak sun hours.</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <NumField id="sol-kwh" label="Daily energy" value={dailyKwh} onChange={setDailyKwh} unit="kWh" />
        <NumField id="sol-w" label="Panel rating" value={panelW} onChange={setPanelW} unit="W" />
        <NumField id="sol-psh" label="Peak sun hours" value={sunHours} onChange={setSunHours} unit="h" />
        <NumField
          id="sol-eff"
          label="System efficiency"
          value={efficiency}
          onChange={setEfficiency}
          step="0.01"
        />
        {result ? (
          <div className="sm:col-span-2">
            <ResultBox>
              <p>
                <strong>Panels</strong> = {result.panels} × {panelW} W →{' '}
                <strong>{result.arrayKw.toFixed(2)} kW</strong> array
              </p>
              <p className="text-xs text-slate-600">
                ≈ {result.energyPerPanelWh.toFixed(0)} Wh per panel per day
              </p>
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function PlcTimerTool() {
  const [preset, setPreset] = useState('')
  const [timeBase, setTimeBase] = useState('100')

  const result = useMemo(() => {
    const p = Number(preset)
    const tb = Number(timeBase)
    if (!p || !tb) return null
    return plcTimerDelay(p, tb)
  }, [preset, timeBase])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">PLC timer delay</CardTitle>
        <CardDescription>Delay = preset × time base (ms).</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <NumField id="plc-preset" label="Preset value" value={preset} onChange={setPreset} step="1" />
        <NumField id="plc-tb" label="Time base" value={timeBase} onChange={setTimeBase} unit="ms" />
        {result ? (
          <div className="sm:col-span-2">
            <ResultBox>
              <p>
                <strong>Delay</strong> = {result.delayMs.toFixed(0)} ms ({result.delaySec.toFixed(2)} s)
              </p>
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function TempConverterTool() {
  const [mode, setMode] = useState<'cToF' | 'fToC'>('cToF')
  const [value, setValue] = useState('')

  const result = useMemo(() => {
    const v = Number(value)
    if (value.trim() === '' || Number.isNaN(v)) return null
    return mode === 'cToF' ? celsiusToFahrenheit(v) : fahrenheitToCelsius(v)
  }, [mode, value])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-900">Temperature converter</CardTitle>
        <CardDescription>Convert between °C and °F.</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Direction</Label>
          <Select value={mode} onValueChange={(v: string) => setMode(v as 'cToF' | 'fToC')}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cToF">°C → °F</SelectItem>
              <SelectItem value="fToC">°F → °C</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <NumField
          id="temp-v"
          label={mode === 'cToF' ? 'Celsius' : 'Fahrenheit'}
          value={value}
          onChange={setValue}
          unit={mode === 'cToF' ? '°C' : '°F'}
        />
        {result ? (
          <div className="sm:col-span-2">
            <ResultBox>
              {mode === 'cToF' ? (
                <p>
                  <strong>{result.c}°C</strong> = <strong>{result.f.toFixed(2)}°F</strong>
                </p>
              ) : (
                <p>
                  <strong>{result.f}°F</strong> = <strong>{result.c.toFixed(2)}°C</strong>
                </p>
              )}
            </ResultBox>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

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

const TAB_TRIGGER_CLASS =
  'data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white'

export function EngineeringToolsPanel({
  showHeading = true,
  defaultTab = 'electrical',
  className,
}: {
  showHeading?: boolean
  defaultTab?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-6 max-w-4xl', className)}>
      {showHeading ? (
        <div>
          <h1 className="text-2xl font-bold text-[var(--brand-navy)] flex items-center gap-2">
            <Calculator className="h-7 w-7" />
            Engineering tools
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quick calculators for electrical, installation, embedded, and solar work — aligned with your
            training programmes. Results are estimates; always verify on site and follow local standards.
          </p>
        </div>
      ) : null}

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="bg-white border border-slate-200 flex flex-wrap h-auto gap-1 p-1">
          {ENGINEERING_TOOL_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <TabsTrigger key={cat.id} value={cat.id} className={TAB_TRIGGER_CLASS}>
                <Icon className="h-4 w-4 mr-1.5" />
                {cat.title}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="electrical" className="space-y-4 mt-0">
          <OhmsLawTool />
          <SinglePhaseTool />
          <ThreePhaseTool />
          <LinePhaseTool />
          <TransformerTool />
          <PfCorrectionTool />
          <UnitConverterTool />
        </TabsContent>

        <TabsContent value="installation" className="space-y-4 mt-0">
          <VoltageDropTool />
          <MotorFlcTool />
          <CableSizeTool />
          <ConduitFillTool />
        </TabsContent>

        <TabsContent value="embedded" className="space-y-4 mt-0">
          <ResistorColorTool />
          <LedResistorTool />
          <VoltageDividerTool />
          <PwmTool />
        </TabsContent>

        <TabsContent value="solar" className="space-y-4 mt-0">
          <SolarSizingTool />
          <PlcTimerTool />
          <TempConverterTool />
        </TabsContent>
      </Tabs>
    </div>
  )
}
