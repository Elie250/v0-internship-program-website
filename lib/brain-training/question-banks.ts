/** YES/NO item banks for engineering fundamentals drills. */

import type { SchematicSymbolId } from '@/lib/brain-training/symbol-ids'

/** 1 = popular basics, 2 = applied core, 3 = harder / trickier */
export type QuizTier = 1 | 2 | 3

export type QuizItem = {
  /** Main question (YES/NO) — shown next to the formula/symbol */
  prompt: string
  /** Large visual / formula / snippet (or caption under SVG) */
  display: string
  /** Optional real schematic SVG instead of ASCII lines */
  symbolId?: SchematicSymbolId
  /** Optional gate inputs shown under logic symbols, e.g. "1, 0" */
  symbolMeta?: string
  /** true => correct answer is YES */
  answerYes: boolean
  /** Short teaching line shown after answer */
  explain?: string
  /** Optional explicit difficulty; otherwise inferred */
  tier?: QuizTier
}

export type QuizBankId =
  | 'ohm-law'
  | 'circuit-symbols'
  | 'logic-gates'
  | 'plc-ladder'
  | 'code-trace'

const OHM_LAW: QuizItem[] = [
  {
    display: 'V = 12 V · R = 4 Ω',
    prompt: 'Is the current I = 3 A?',
    answerYes: true,
    explain: 'I = V / R = 12 / 4 = 3 A.',
  },
  {
    display: 'V = 24 V · R = 8 Ω',
    prompt: 'Is the current I = 3 A?',
    answerYes: true,
    explain: 'I = V / R = 24 / 8 = 3 A.',
  },
  { display: 'I = 2 A · R = 10 Ω', prompt: 'Is the voltage V = 20 V?', answerYes: true },
  { display: 'V = 10 V · I = 2 A', prompt: 'Is the resistance R = 5 Ω?', answerYes: true },
  { display: 'V = 12 V · R = 6 Ω', prompt: 'Is the current I = 3 A?', answerYes: false },
  { display: 'V = 5 V · R = 10 Ω', prompt: 'Is the current I = 0.5 A?', answerYes: true },
  { display: 'I = 0.1 A · R = 100 Ω', prompt: 'Is V = 10 V?', answerYes: true },
  { display: 'V = 230 V · R = 46 Ω', prompt: 'Is I = 5 A?', answerYes: true },
  { display: 'V = 9 V · I = 3 A', prompt: 'Is R = 2 Ω?', answerYes: false },
  { display: 'P = V × I', prompt: 'Is power P equal to V × I?', answerYes: true },
  { display: 'Series: R1=2Ω, R2=3Ω', prompt: 'Is Req = 5 Ω?', answerYes: true },
  { display: 'Parallel equal 10Ω + 10Ω', prompt: 'Is Req = 5 Ω?', answerYes: true },
  { display: 'Series: 4Ω + 4Ω + 4Ω', prompt: 'Is Req = 8 Ω?', answerYes: false },
  { display: 'V = I × R', prompt: 'Is Ohm’s law V = I × R?', answerYes: true },
  { display: 'I = V / R', prompt: 'Is current I = V × R?', answerYes: false },
  { display: 'V = 48 V · R = 16 Ω', prompt: 'Is I = 4 A?', answerYes: false },
  { display: 'I = 4 A · R = 2.5 Ω', prompt: 'Is V = 10 V?', answerYes: true },
  { display: 'Ω', prompt: 'Is Ohm the unit of resistance?', answerYes: true },
  { display: 'Current unit', prompt: 'Is current measured in Volts?', answerYes: false },
  { display: 'LED', prompt: 'Must it be forward-biased to light?', answerYes: true },
  {
    display: 'V = 6 V · R = 3 Ω',
    prompt: 'Is the current I = 2 A?',
    answerYes: true,
    explain: 'I = V / R = 6 / 3 = 2 A.',
  },
  {
    display: 'V = 15 V · R = 5 Ω',
    prompt: 'Is the current I = 2 A?',
    answerYes: false,
    explain: 'I = 15 / 5 = 3 A, not 2 A.',
  },
  {
    display: 'I = 3 A · R = 4 Ω',
    prompt: 'Is the voltage V = 12 V?',
    answerYes: true,
    explain: 'V = I × R = 3 × 4 = 12 V.',
  },
  {
    display: 'V = 20 V · I = 4 A',
    prompt: 'Is R = 4 Ω?',
    answerYes: false,
    explain: 'R = V / I = 20 / 4 = 5 Ω.',
  },
  { display: 'P = I² × R', prompt: 'Can power also be written as I² × R?', answerYes: true },
  {
    display: 'Series: 1Ω + 2Ω + 3Ω',
    prompt: 'Is Req = 5 Ω?',
    answerYes: false,
    explain: 'In series, add: 1 + 2 + 3 = 6 Ω.',
  },
  {
    display: 'Parallel equal 6Ω + 6Ω',
    prompt: 'Is Req = 3 Ω?',
    answerYes: true,
    explain: 'Two equal resistors in parallel give half: 6 / 2 = 3 Ω.',
  },
  {
    display: 'Parallel equal 8Ω + 8Ω',
    prompt: 'Is Req = 8 Ω?',
    answerYes: false,
    explain: 'Equal parallel pair halves: Req = 4 Ω.',
  },
  { display: 'Unit of voltage', prompt: 'Is the unit of voltage the Ampere?', answerYes: false },
  {
    display: 'Unit of power',
    prompt: 'Is the unit of electrical power the Ohm?',
    answerYes: false,
    explain: 'Power is measured in Watts (W).',
  },
  {
    display: 'V = 100 V · R = 50 Ω',
    prompt: 'Is I = 2 A?',
    answerYes: true,
    explain: 'I = 100 / 50 = 2 A.',
  },
  {
    display: 'V = 18 V · R = 9 Ω',
    prompt: 'Is I = 3 A?',
    answerYes: false,
    explain: 'I = 18 / 9 = 2 A.',
  },
  { display: 'Open circuit', prompt: 'Is current normally high in an open circuit?', answerYes: false },
  {
    display: 'Short circuit ideal',
    prompt: 'Does an ideal short have infinite resistance?',
    answerYes: false,
    explain: 'An ideal short has near-zero resistance.',
  },
  {
    display: 'P = V² / R',
    prompt: 'Can power also be written as V² / R?',
    answerYes: true,
    explain: 'From P = V × I and I = V / R you get P = V² / R.',
  },
  {
    display: 'I = 5 A · V = 10 V',
    prompt: 'Is R = 50 Ω?',
    answerYes: false,
    explain: 'R = V / I = 10 / 5 = 2 Ω.',
  },
  { display: 'kΩ to Ω', prompt: 'Is 1 kΩ equal to 100 Ω?', answerYes: false },
  {
    display: 'mA to A',
    prompt: 'Is 500 mA equal to 5 A?',
    answerYes: false,
    explain: '500 mA = 0.5 A.',
  },
]

const CIRCUIT_SYMBOLS: QuizItem[] = [
  { symbolId: 'resistor', display: 'Resistor', prompt: 'Is this a resistor?', answerYes: true, tier: 1 },
  { symbolId: 'capacitor', display: 'Capacitor', prompt: 'Is this a capacitor?', answerYes: true, tier: 1 },
  { symbolId: 'diode', display: 'Diode', prompt: 'Is this a diode?', answerYes: true, tier: 1 },
  { symbolId: 'lamp', display: 'Lamp', prompt: 'Is this a lamp / indicator?', answerYes: true, tier: 1 },
  { symbolId: 'inductor', display: 'Inductor', prompt: 'Is this an inductor (coil)?', answerYes: true, tier: 1 },
  { symbolId: 'battery', display: 'Battery', prompt: 'Is this a battery / cell?', answerYes: true, tier: 1 },
  { symbolId: 'ground', display: 'Earth / ground', prompt: 'Is this earth / ground?', answerYes: true, tier: 1 },
  { symbolId: 'switch', display: 'Switch', prompt: 'Is this a simple switch?', answerYes: true, tier: 1 },
  { symbolId: 'fuse', display: 'Fuse', prompt: 'Is this a fuse?', answerYes: true, tier: 1 },
  { symbolId: 'led', display: 'LED', prompt: 'Is this an LED (light arrows out)?', answerYes: true, tier: 1 },
  { symbolId: 'resistor', display: 'Resistor', prompt: 'Is this a capacitor?', answerYes: false, tier: 1 },
  { symbolId: 'capacitor', display: 'Capacitor', prompt: 'Is this a resistor?', answerYes: false, tier: 1 },
  { symbolId: 'ac', display: 'AC source', prompt: 'Is this an AC supply?', answerYes: true, tier: 2 },
  { symbolId: 'potentiometer', display: 'Potentiometer', prompt: 'Is this an adjustable resistor (pot)?', answerYes: true, tier: 2 },
  { symbolId: 'motor', display: 'Motor', prompt: 'Is this an electric motor?', answerYes: true, tier: 2 },
  { symbolId: 'transformer', display: 'Transformer', prompt: 'Is this a transformer?', answerYes: true, tier: 2 },
  { symbolId: 'npn', display: 'NPN BJT', prompt: 'Is the emitter arrow pointing OUT (NPN)?', answerYes: true, tier: 2 },
  {
    symbolId: 'pnp',
    display: 'PNP BJT',
    prompt: 'Is the emitter arrow pointing OUT (like NPN)?',
    answerYes: false,
    explain: 'PNP arrow points in; NPN points out.',
    tier: 2,
  },
  {
    symbolId: 'zener',
    display: 'Zener diode',
    prompt: 'Is this drawn like a plain resistor?',
    answerYes: false,
    explain: 'Zener uses a diode triangle with a winged cathode bar.',
    tier: 2,
  },
  { symbolId: 'inductor', display: 'Inductor', prompt: 'Is this a speaker?', answerYes: false, tier: 2 },
  { symbolId: 'fuse', display: 'Fuse', prompt: 'Is this a connector terminal?', answerYes: false, tier: 2 },
  { symbolId: 'ground', display: 'Ground', prompt: 'Is this a battery?', answerYes: false, tier: 2 },
  { symbolId: 'capacitor', display: 'Capacitor', prompt: 'Is this a fuse?', answerYes: false, tier: 2 },
  { symbolId: 'diode', display: 'Diode', prompt: 'Is this an LED?', answerYes: false, tier: 2 },
  { symbolId: 'led', display: 'LED', prompt: 'Do the arrows mean light coming OUT?', answerYes: true, tier: 2 },
  { display: '2.2 kΩ', prompt: 'Is 2.2 kΩ = 2200 Ω?', answerYes: true, tier: 1 },
  { display: 'µF', prompt: 'Is µF a capacitance unit?', answerYes: true, tier: 1 },
  { display: 'mH', prompt: 'Is mH a capacitance unit?', answerYes: false, explain: 'mH is inductance.', tier: 2 },
  { display: 'nF', prompt: 'Is nF a resistance unit?', answerYes: false, explain: 'nF is capacitance.', tier: 2 },
  {
    display: 'Electrolytic cap',
    prompt: 'Can you wire an electrolytic either way safely?',
    answerYes: false,
    explain: 'Polarized — reverse voltage can damage it.',
    tier: 3,
  },
  {
    display: 'Wire cross (no dot)',
    prompt: 'Does a cross with no dot always mean connected?',
    answerYes: false,
    explain: 'No-dot crosses usually pass without joining.',
    tier: 3,
  },
  { symbolId: 'switch', display: 'NO push contact', prompt: 'Is a push-button often a momentary contact?', answerYes: true, tier: 2 },
  { symbolId: 'battery', display: 'DC cell', prompt: 'Can this show a DC supply?', answerYes: true, tier: 1 },
  { symbolId: 'resistor', display: 'Heater load', prompt: 'Is a heater usually drawn as a diode?', answerYes: false, tier: 3 },
  { symbolId: 'transformer', display: 'Transformer', prompt: 'Is this two facing coils (transformer)?', answerYes: true, tier: 2 },
  { symbolId: 'ac', display: 'AC', prompt: 'Is the sine-in-circle a battery?', answerYes: false, tier: 2 },
]

const LOGIC_GATES: QuizItem[] = [
  { symbolId: 'and', display: 'AND gate', symbolMeta: 'inputs 1, 1', prompt: 'Output 1?', answerYes: true, tier: 1 },
  { symbolId: 'and', display: 'AND gate', symbolMeta: 'inputs 1, 0', prompt: 'Output 1?', answerYes: false, tier: 1 },
  { symbolId: 'or', display: 'OR gate', symbolMeta: 'inputs 0, 0', prompt: 'Output 0?', answerYes: true, tier: 1 },
  { symbolId: 'or', display: 'OR gate', symbolMeta: 'inputs 1, 0', prompt: 'Output 1?', answerYes: true, tier: 1 },
  { symbolId: 'not', display: 'NOT gate', symbolMeta: 'input 0', prompt: 'Output 1?', answerYes: true, tier: 1 },
  { symbolId: 'not', display: 'NOT gate', symbolMeta: 'input 1', prompt: 'Output 0?', answerYes: true, tier: 1 },
  { symbolId: 'nand', display: 'NAND', symbolMeta: 'inputs 1, 1', prompt: 'Output 0?', answerYes: true, tier: 2 },
  { symbolId: 'nand', display: 'NAND', symbolMeta: 'inputs 0, 1', prompt: 'Output 1?', answerYes: true, tier: 2 },
  { symbolId: 'nor', display: 'NOR', symbolMeta: 'inputs 0, 0', prompt: 'Output 1?', answerYes: true, tier: 2 },
  { symbolId: 'xor', display: 'XOR', symbolMeta: 'inputs 1, 0', prompt: 'Output 1?', answerYes: true, tier: 2 },
  { symbolId: 'xor', display: 'XOR', symbolMeta: 'inputs 1, 1', prompt: 'Output 0?', answerYes: true, tier: 2 },
  { symbolId: 'xor', display: 'XOR', symbolMeta: 'inputs 0, 0', prompt: 'Output 1?', answerYes: false, tier: 2 },
  { display: '1010₂', prompt: 'Equals 10 in decimal?', answerYes: true, tier: 1 },
  { display: '0111₂', prompt: 'Equals 8 in decimal?', answerYes: false, tier: 2 },
  { display: 'Active-high', prompt: 'Does logic 1 turn it ON?', answerYes: true, tier: 2 },
  { display: 'Pull-up', prompt: 'Does it hold an open pin HIGH?', answerYes: true, tier: 2 },
  { display: 'Switch bounce', prompt: 'Can bounce fake extra edges?', answerYes: true, tier: 2 },
  { display: 'Flip-flop', prompt: 'Does it store one bit?', answerYes: true, tier: 2 },
  { display: 'Tri-state', prompt: 'Can the pin float (high-Z)?', answerYes: true, tier: 3 },
  { symbolId: 'and', display: 'AND', symbolMeta: 'any input = 1', prompt: 'Is AND “1 if any input is 1”?', answerYes: false, tier: 2 },
  {
    symbolId: 'and',
    display: 'AND',
    symbolMeta: 'inputs 0, 0',
    prompt: 'Output 1?',
    answerYes: false,
    explain: 'AND needs every input = 1.',
    tier: 1,
  },
  {
    symbolId: 'or',
    display: 'OR',
    symbolMeta: 'inputs 1, 1',
    prompt: 'Output 0?',
    answerYes: false,
    explain: 'OR is 1 if any input is 1.',
    tier: 1,
  },
  {
    symbolId: 'nor',
    display: 'NOR',
    symbolMeta: 'inputs 1, 0',
    prompt: 'Output 1?',
    answerYes: false,
    explain: 'OR would be 1, so NOR is 0.',
    tier: 2,
  },
  {
    symbolId: 'nand',
    display: 'NAND',
    symbolMeta: 'inputs 0, 0',
    prompt: 'Output 0?',
    answerYes: false,
    explain: 'NAND is 0 only when all inputs are 1.',
    tier: 2,
  },
  {
    display: 'XNOR · 1,1',
    prompt: 'Output 0?',
    answerYes: false,
    explain: 'XNOR is 1 when inputs match.',
    tier: 3,
  },
  {
    display: 'XNOR · 1,0',
    prompt: 'Output 1?',
    answerYes: false,
    explain: 'Different inputs → XNOR = 0.',
    tier: 3,
  },
  {
    display: '1100₂',
    prompt: 'Equals 10 decimal?',
    answerYes: false,
    explain: '1100₂ = 12.',
    tier: 2,
  },
  {
    display: '0010₂',
    prompt: 'Equals 4 decimal?',
    answerYes: false,
    explain: '0010₂ = 2.',
    tier: 2,
  },
  {
    display: 'Pull-down',
    prompt: 'Does it hold an open pin HIGH?',
    answerYes: false,
    explain: 'Pull-down holds LOW; pull-up holds HIGH.',
    tier: 2,
  },
  {
    display: 'Active-low',
    prompt: 'Does logic 1 turn it ON?',
    answerYes: false,
    tier: 3,
  },
  {
    display: 'Buffer',
    prompt: 'Does a buffer invert the signal?',
    answerYes: false,
    explain: 'Buffer copies; NOT inverts.',
    tier: 2,
  },
  {
    symbolId: 'or',
    display: 'OR',
    symbolMeta: 'inputs 0, 1',
    prompt: 'Output 0?',
    answerYes: false,
    explain: 'One input is 1 → OR = 1.',
    tier: 1,
  },
  {
    display: '1 bit',
    prompt: 'Only 0 or 1?',
    answerYes: true,
    tier: 1,
  },
  {
    display: '1 byte',
    prompt: 'Equals 16 bits?',
    answerYes: false,
    explain: 'A byte is 8 bits.',
    tier: 1,
  },
  {
    display: 'AND alone',
    prompt: 'Does a plain AND store a bit?',
    answerYes: false,
    explain: 'Gates don’t store; flip-flops do.',
    tier: 3,
  },
  {
    symbolId: 'xor',
    display: 'XOR',
    symbolMeta: 'inputs 0, 1',
    prompt: 'Output 0?',
    answerYes: false,
    explain: 'Different inputs → XOR = 1.',
    tier: 2,
  },
  {
    display: 'De Morgan',
    prompt: 'Is NOT(A AND B) = (NOT A) AND (NOT B)?',
    answerYes: false,
    explain: 'It equals (NOT A) OR (NOT B).',
    tier: 3,
  },
  {
    display: 'Hex digit F',
    prompt: 'Is hex F equal to decimal 16?',
    answerYes: false,
  },
]

const PLC_LADDER: QuizItem[] = [
  { display: 'NO contact ─| |─', prompt: 'Is an NO contact open when its bit is FALSE?', answerYes: true },
  { display: 'NC contact ─|/|─', prompt: 'Is an NC contact closed when its bit is FALSE?', answerYes: true },
  { display: 'Coil ─( )─', prompt: 'Does energizing a coil set its bit TRUE?', answerYes: true },
  { display: 'Series NO + NO', prompt: 'Do series contacts act like a logical AND?', answerYes: true },
  { display: 'Parallel NO / NO', prompt: 'Do parallel contacts act like a logical OR?', answerYes: true },
  { display: 'Seal-in / latch', prompt: 'Can an NO contact of a coil parallel the start to latch?', answerYes: true },
  { display: 'STOP as NC', prompt: 'Is an emergency STOP often wired as NC for failsafe?', answerYes: true },
  { display: 'Scan cycle', prompt: 'Does a PLC repeatedly read inputs → logic → write outputs?', answerYes: true },
  { display: 'Timer TON', prompt: 'Does a TON delay turning ON after the rung is true?', answerYes: true },
  { display: 'Counter CTU', prompt: 'Does a CTU count up on rising edges?', answerYes: true },
  { display: 'NO vs NC', prompt: 'Is an NO contact closed at rest?', answerYes: false },
  { display: 'Coil in series mid-rung', prompt: 'Should an output coil normally sit at the right of the rung?', answerYes: true },
  { display: 'Retentive memory', prompt: 'Can some bits keep state after power loss if retentive?', answerYes: true },
  { display: 'Interposing relay', prompt: 'Can a relay isolate PLC outputs from heavy loads?', answerYes: true },
  { display: 'PNP vs NPN input', prompt: 'Do wiring standards matter for sensor sourcing/sinking?', answerYes: true },
  { display: 'Watchdog / faults', prompt: 'Can a PLC fault stop the user program scan?', answerYes: true },
  { display: 'HMI tag', prompt: 'Can an HMI write a bit that drives a PLC coil?', answerYes: true },
  { display: 'Ladder OR of STOP', prompt: 'Should E-STOP be paralleled with run logic to force RUN?', answerYes: false },
  { display: 'One-shots', prompt: 'Is a rising-edge one-shot useful for a single pulse action?', answerYes: true },
  { display: 'I/O addressing', prompt: 'Are input and output addresses typically distinct?', answerYes: true },
  {
    display: 'TOF timer',
    prompt: 'Does a TOF turn ON immediately when the rung goes false?',
    answerYes: false,
    explain: 'TOF delays turning OFF after the rung goes false.',
  },
  {
    display: 'CTD counter',
    prompt: 'Does a CTD count up like a CTU?',
    answerYes: false,
    explain: 'CTD decreases the count; CTU increases it.',
  },
  {
    display: 'NC of motor overload',
    prompt: 'Is an overload trip contact usually ignored in run logic?',
    answerYes: false,
  },
  {
    display: 'Two coils same bit',
    prompt: 'Is it good practice to energize the same coil on many rungs?',
    answerYes: false,
    explain: 'Duplicate coils fight each other; use one coil and branch logic.',
  },
  {
    display: 'SET / RESET',
    prompt: 'Does SET clear a bit to OFF forever?',
    answerYes: false,
    explain: 'SET forces ON until RESET (or similar) clears it.',
  },
  {
    display: 'Analog input',
    prompt: 'Must every PLC input be only ON or OFF (digital)?',
    answerYes: false,
    explain: 'Many PLCs also accept analog values (0–10 V, 4–20 mA).',
  },
  {
    display: 'Rung power flow left→right',
    prompt: 'Does ladder logic usually evaluate right to left?',
    answerYes: false,
  },
  {
    display: 'Failsafe STOP in series',
    prompt: 'Should STOP be placed so an open wire can still force RUN?',
    answerYes: false,
    explain: 'Series NC STOP drops the rung if the wire opens or STOP is pressed.',
  },
  {
    display: 'Forced I/O',
    prompt: 'Is forcing I/O recommended for normal production running?',
    answerYes: false,
  },
  {
    display: 'TON done bit',
    prompt: 'Does a TON done bit stay TRUE before the preset time is reached?',
    answerYes: false,
    explain: 'Done (DN) becomes TRUE only after the accumulated time meets preset.',
  },
  {
    display: 'Internal markers / memory bits',
    prompt: 'Do memory bits always need a physical output card?',
    answerYes: false,
    explain: 'Flags and markers exist only in PLC memory for logic.',
  },
  {
    display: 'Compare EQ',
    prompt: 'Can a compare instruction check if two values are equal?',
    answerYes: true,
  },
  {
    display: 'Rising edge on held button',
    prompt: 'Does a rising-edge pulse fire every scan while a button stays pressed?',
    answerYes: false,
    explain: 'A rising-edge one-shot fires once when the signal goes FALSE→TRUE.',
  },
  {
    display: 'Safety PLC vs standard',
    prompt: 'Can a simple non-safety PLC replace a certified E-STOP chain?',
    answerYes: false,
  },
  {
    display: 'Coil left rail',
    prompt: 'Should the output coil normally sit on the left power rail?',
    answerYes: false,
    explain: 'Coils belong on the right; contacts build the path from the left.',
  },
  {
    display: 'Pulse / clock contact',
    prompt: 'Does a one-scan pulse stay TRUE for the whole machine cycle forever?',
    answerYes: false,
  },
  {
    display: 'NC contact bit TRUE',
    prompt: 'Is an NC contact closed when its bit is TRUE?',
    answerYes: false,
    explain: 'NC conducts when the bit is FALSE and opens when the bit is TRUE.',
  },
  {
    display: 'Program vs data files',
    prompt: 'Are input addresses and output addresses always the same number?',
    answerYes: false,
  },
]

const CODE_TRACE: QuizItem[] = [
  { display: 'x = 2\nx = x + 1', prompt: 'Is x equal to 3 afterward?', answerYes: true },
  { display: 'a = 5\nb = a * 2', prompt: 'Is b equal to 10?', answerYes: true },
  { display: 'n = 4\nif n > 3: t = 1\nelse: t = 0', prompt: 'Is t equal to 1?', answerYes: true },
  { display: 's = "ab" + "c"', prompt: 'Is s equal to "abc"?', answerYes: true },
  { display: 'arr = [1,2,3]\nx = arr[0]', prompt: 'Is x equal to 1?', answerYes: true },
  { display: 'for i in range(3):\n  pass', prompt: 'Does i run 0,1,2?', answerYes: true },
  { display: 'x = 10 % 3', prompt: 'Is x equal to 1?', answerYes: true },
  { display: 'x = 2 ** 3', prompt: 'Is x equal to 8?', answerYes: true },
  { display: 'flag = True\nflag = not flag', prompt: 'Is flag False afterward?', answerYes: true },
  { display: 'x = 7 // 2', prompt: 'Is x equal to 3 (integer divide)?', answerYes: true },
  { display: 'x = abs(-4)', prompt: 'Is x equal to 4?', answerYes: true },
  { display: 'x = min(3, 9, 1)', prompt: 'Is x equal to 1?', answerYes: true },
  { display: 'x = 0\nx += 5', prompt: 'Is x equal to 5?', answerYes: true },
  { display: 'x = "5" + "5"', prompt: 'Is x equal to 10 (number)?', answerYes: false },
  { display: 'x = int("5") + int("5")', prompt: 'Is x equal to 10?', answerYes: true },
  { display: 'x = len("PLC")', prompt: 'Is x equal to 3?', answerYes: true },
  { display: 'x = 2\ny = x\nx = 9', prompt: 'Is y still 2?', answerYes: true },
  { display: 'if 0:\n  x = 1\nelse:\n  x = 2', prompt: 'Is x equal to 2?', answerYes: true },
  { display: 'x = True and False', prompt: 'Is x True?', answerYes: false },
  { display: 'x = True or False', prompt: 'Is x True?', answerYes: true },
  {
    display: 'x = 3\nx = x * 2',
    prompt: 'Is x equal to 5 afterward?',
    answerYes: false,
    explain: '3 × 2 = 6.',
  },
  {
    display: 'x = 8 - 3',
    prompt: 'Is x equal to 4?',
    answerYes: false,
    explain: '8 − 3 = 5.',
  },
  {
    display: 'x = max(2, 5, 4)',
    prompt: 'Is x equal to 2?',
    answerYes: false,
    explain: 'max picks the largest value: 5.',
  },
  {
    display: 'arr = [10,20,30]\nx = arr[2]',
    prompt: 'Is x equal to 20?',
    answerYes: false,
    explain: 'Index 2 is the third item: 30.',
  },
  {
    display: 'x = 9 % 4',
    prompt: 'Is x equal to 2?',
    answerYes: false,
    explain: '9 divided by 4 leaves remainder 1.',
  },
  {
    display: 'x = 3 ** 2',
    prompt: 'Is x equal to 6?',
    answerYes: false,
    explain: '** means power: 3² = 9.',
  },
  {
    display: 'n = 2\nif n == 2: t = 5\nelse: t = 0',
    prompt: 'Is t equal to 0?',
    answerYes: false,
  },
  {
    display: 'x = False or False',
    prompt: 'Is x True?',
    answerYes: false,
    explain: 'OR is True only if at least one side is True.',
  },
  {
    display: 'x = not False',
    prompt: 'Is x False?',
    answerYes: false,
    explain: 'not False is True.',
  },
  {
    display: 's = "hi"\nx = len(s)',
    prompt: 'Is x equal to 3?',
    answerYes: false,
  },
  {
    display: 'x = 5 // 2',
    prompt: 'Is x equal to 2.5?',
    answerYes: false,
    explain: '// is integer divide: 5 // 2 = 2.',
  },
  {
    display: 'x = 1\nx -= 1',
    prompt: 'Is x equal to 2?',
    answerYes: false,
    explain: 'x -= 1 means x = x − 1, so x becomes 0.',
  },
  {
    display: 'a = [1,2]\nb = a\na.append(3)',
    prompt: 'Does b stay [1,2] after append?',
    answerYes: false,
    explain: 'a and b refer to the same list, so b becomes [1,2,3].',
  },
  {
    display: 'x = int(3.9)',
    prompt: 'Is x equal to 4?',
    answerYes: false,
    explain: 'int truncates toward zero: int(3.9) is 3.',
  },
  {
    display: 'for i in range(1, 4):\n  pass',
    prompt: 'Does i run 1,2,3,4?',
    answerYes: false,
    explain: 'range(1, 4) stops before 4: 1,2,3.',
  },
  {
    display: 'x = "7" * 2',
    prompt: 'Is x equal to 14 (number)?',
    answerYes: false,
    explain: 'String repeat gives "77", not the number 14.',
  },
  {
    display: 'x = True and True',
    prompt: 'Is x False?',
    answerYes: false,
  },
  {
    display: 'n = 10\nif n < 5: t = 1\nelse: t = 9',
    prompt: 'Is t equal to 1?',
    answerYes: false,
    explain: '10 is not less than 5, so the else branch sets t = 9.',
  },
]

const BANKS: Record<QuizBankId, QuizItem[]> = {
  'ohm-law': OHM_LAW,
  'circuit-symbols': CIRCUIT_SYMBOLS,
  'logic-gates': LOGIC_GATES,
  'plc-ladder': PLC_LADDER,
  'code-trace': CODE_TRACE,
}

function withExplain(item: QuizItem): QuizItem {
  if (item.explain) return item
  return {
    ...item,
    explain: item.answerYes
      ? 'Yes — that statement is correct.'
      : 'No — re-check the formula, symbol, or condition.',
  }
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

/** Prefer popular foundational knowledge for early stages. */
export function inferQuizTier(item: QuizItem): QuizTier {
  if (item.tier === 1 || item.tier === 2 || item.tier === 3) return item.tier
  const t = `${item.display}\n${item.prompt}`.toLowerCase()

  if (
    includesAny(t, [
      'watchdog',
      'retentive',
      'interposing',
      'tri-state',
      'one-shot',
      'zener',
      'seal-in',
      'debounce',
      'flip-flop',
      'pull-up',
      'active-high',
      'binary ',
      'npn',
      'pnp',
      'potentiometer',
      'transformer',
      'schematic vs',
      'emergency',
      'scan cycle',
      'timer ton',
      'counter ctu',
      'hmi',
      'nand ·',
      'nor ·',
      'xor ·',
      'range(',
      'len(',
      'abs(',
      'min(',
      'int(',
      'parallel equal',
      'series:',
      'µf',
      'kilo-ohm',
      'failsafe',
      'energiz',
    ])
  ) {
    return 3
  }

  if (
    includesAny(t, [
      'unit of',
      "ohm's law",
      'ohms law',
      'v = i × r',
      'v = i * r',
      'is power p',
      'resistor?',
      'capacitor?',
      'and · inputs',
      'or · inputs',
      'not · input',
      'no contact',
      'nc contact',
      'coil',
      'x = 2',
      'x = x + 1',
      'true or false',
      'true and false',
      'lamp',
      'battery long',
      'ground / earth',
      'fuse ',
      'speaker',
      'motor circle',
      'is the current i = 3',
      'is the voltage v = 20',
      'is the resistance r = 5',
      'arr = [1,2,3]',
      's = "ab"',
      'flag = true',
      'diode symbol',
      'circle with x',
    ])
  ) {
    return 1
  }

  return 2
}

/** Which tiers appear at each stage (cycled while filling the round). */
const STAGE_TIER_PATTERN: Record<number, QuizTier[]> = {
  1: [1, 1, 1, 1],
  2: [1, 1, 1, 2],
  3: [1, 2, 2, 2],
  4: [2, 2, 2, 3],
  5: [2, 3, 3, 3],
  6: [3, 3, 3, 3],
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export function getQuizBank(id: QuizBankId): QuizItem[] {
  return (BANKS[id] ?? []).map(withExplain)
}

/**
 * Build a round matched to stage difficulty + timer.
 * Stage 1–2 ≈ popular basics; stages 5–6 ≈ harder applied items.
 */
export function pickQuizRound(bankId: QuizBankId, count: number, stageLevel = 1): QuizItem[] {
  const stage = Math.min(6, Math.max(1, Math.round(stageLevel)))
  const pattern = STAGE_TIER_PATTERN[stage] ?? [1, 2, 3]
  const bank = getQuizBank(bankId).map((item) => ({ ...item, tier: inferQuizTier(item) }))

  const pools: Record<QuizTier, QuizItem[]> = { 1: [], 2: [], 3: [] }
  for (const item of bank) pools[item.tier!].push(item)
  shuffleInPlace(pools[1])
  shuffleInPlace(pools[2])
  shuffleInPlace(pools[3])

  const cursor: Record<QuizTier, number> = { 1: 0, 2: 0, 3: 0 }
  const take = (tier: QuizTier): QuizItem | null => {
    const pool = pools[tier]
    if (cursor[tier] >= pool.length) return null
    const item = pool[cursor[tier]]!
    cursor[tier] += 1
    return item
  }

  const out: QuizItem[] = []
  let i = 0
  while (out.length < count) {
    const preferred = pattern[i % pattern.length]!
    i += 1
    const order: QuizTier[] =
      preferred === 1 ? [1, 2, 3] : preferred === 2 ? [2, 1, 3] : [3, 2, 1]
    let picked: QuizItem | null = null
    for (const tier of order) {
      picked = take(tier)
      if (picked) break
    }
    if (!picked) break
    out.push(picked)
  }

  // Exhausted unique items — allow reshuffle fill so rounds never come short.
  if (out.length < count) {
    const refill = shuffleInPlace([...bank])
    let r = 0
    while (out.length < count && refill.length > 0) {
      out.push(refill[r % refill.length]!)
      r += 1
    }
  }

  return out.slice(0, count)
}
