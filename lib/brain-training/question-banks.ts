/** YES/NO item banks for engineering fundamentals drills. */

/** 1 = popular basics, 2 = applied core, 3 = harder / trickier */
export type QuizTier = 1 | 2 | 3

export type QuizItem = {
  /** Main question (YES/NO) */
  prompt: string
  /** Large visual / formula / snippet */
  display: string
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
  { display: 'Unit of resistance', prompt: 'Is the unit of resistance the Ohm (Ω)?', answerYes: true },
  { display: 'Unit of current', prompt: 'Is the unit of current the Volt?', answerYes: false },
  { display: 'LED polarity', prompt: 'Must an LED be forward-biased to light?', answerYes: true },
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
  { display: '─/\/\/\─', prompt: 'Does this usually represent a resistor?', answerYes: true },
  { display: '─||─', prompt: 'Does this usually represent a capacitor?', answerYes: true },
  { display: '─|←|─ (triangle/line)', prompt: 'Is a diode symbol typically arrow-to-bar?', answerYes: true },
  { display: 'Circle with X cross', prompt: 'Is that a common lamp/indicator symbol?', answerYes: true },
  { display: 'Coil spiral symbol', prompt: 'Does a spiral often mean an inductor?', answerYes: true },
  { display: 'Battery long/short lines', prompt: 'Do long & short parallel lines show a cell/battery?', answerYes: true },
  { display: 'Ground / earth symbol', prompt: 'Is the earth/ground symbol three decreasing lines?', answerYes: true },
  { display: 'NPN transistor', prompt: 'Does an NPN BJT symbol show an arrow out of the emitter?', answerYes: true },
  { display: 'SPST switch', prompt: 'Is an open break in a line a simple switch?', answerYes: true },
  { display: 'Fuse zig-zag or bar-in-rect', prompt: 'Is a fuse protecting against overcurrent?', answerYes: true },
  { display: 'Transformer coils', prompt: 'Do two facing coils often mean a transformer?', answerYes: true },
  { display: '─/\/\/\─', prompt: 'Does this symbol primarily mean a capacitor?', answerYes: false },
  { display: '─||─', prompt: 'Does this primarily mean a resistor?', answerYes: false },
  { display: 'LED = diode + arrows out', prompt: 'Do outward light arrows mark an LED?', answerYes: true },
  { display: 'AC source sine-in-circle', prompt: 'Can a sine wave in a circle mean AC supply?', answerYes: true },
  { display: 'Potentiometer (resistor + arrow)', prompt: 'Is a potentiometer an adjustable resistor?', answerYes: true },
  { display: 'Normally open contact', prompt: 'Is an NO contact closed when at rest?', answerYes: false },
  { display: 'Schematic vs wiring diagram', prompt: 'Does a schematic emphasize function over physical layout?', answerYes: true },
  { display: 'Kilo-ohm', prompt: 'Is 2.2 kΩ equal to 2200 Ω?', answerYes: true },
  { display: 'µF', prompt: 'Is µF a unit of capacitance?', answerYes: true },
  {
    display: 'PNP transistor',
    prompt: 'Does a PNP BJT symbol show an arrow out of the emitter?',
    answerYes: false,
    explain: 'PNP arrow points in; NPN arrow points out.',
  },
  {
    display: 'Zener diode',
    prompt: 'Is a Zener drawn exactly like a plain resistor?',
    answerYes: false,
    explain: 'A Zener uses a diode shape with a bent/winged cathode bar.',
  },
  {
    display: 'Speaker / bell',
    prompt: 'Is a spiral coil the usual speaker symbol?',
    answerYes: false,
    explain: 'A spiral often means an inductor; speakers use other shapes.',
  },
  {
    display: 'Motor circle-M',
    prompt: 'Can a circle with M mean an electric motor?',
    answerYes: true,
  },
  {
    display: 'Varistor / VDR',
    prompt: 'Is a varistor mainly used to store charge like a battery?',
    answerYes: false,
    explain: 'A varistor protects against voltage spikes; it is not energy storage.',
  },
  {
    display: 'Connector / terminal',
    prompt: 'Is a connector symbol the same as a fuse?',
    answerYes: false,
  },
  {
    display: 'Normally closed contact',
    prompt: 'Is an NC contact open when at rest?',
    answerYes: false,
    explain: 'NC means normally closed — closed until the coil or signal acts.',
  },
  {
    display: 'Photodiode',
    prompt: 'Do light arrows pointing out mark a photodiode?',
    answerYes: false,
    explain: 'Photodiode arrows point in; LED arrows point out.',
  },
  {
    display: 'mH',
    prompt: 'Is mH a unit of capacitance?',
    answerYes: false,
    explain: 'mH is inductance; capacitance uses F, µF, nF.',
  },
  {
    display: '─||─',
    prompt: 'Does this primarily mean a fuse?',
    answerYes: false,
    explain: 'Parallel plates usually mean a capacitor.',
  },
  {
    display: 'Chassis ground',
    prompt: 'Is chassis ground the same symbol as a battery?',
    answerYes: false,
    explain: 'Chassis/earth uses a stepped-line symbol, not battery cells.',
  },
  {
    display: 'Push-button NO',
    prompt: 'Is a push-button often drawn as a momentary contact?',
    answerYes: true,
  },
  {
    display: 'Relay coil',
    prompt: 'Does a relay coil symbol usually mean a capacitor?',
    answerYes: false,
    explain: 'Relay coils are drawn as coils or labeled coil blocks.',
  },
  {
    display: 'Polarized capacitor',
    prompt: 'Can electrolytic capacitors be wired either way safely?',
    answerYes: false,
    explain: 'Electrolytics are polarized; reverse voltage can damage them.',
  },
  {
    display: 'Wire cross (no dot)',
    prompt: 'Does a wire cross without a dot always mean a connection?',
    answerYes: false,
    explain: 'No-dot crosses usually mean wires pass without joining.',
  },
  {
    display: 'nF',
    prompt: 'Is nF a unit of resistance?',
    answerYes: false,
    explain: 'nF (nanofarad) is capacitance; resistance uses Ω.',
  },
  {
    display: 'DC source',
    prompt: 'Can a battery or labeled DC circle show a DC supply?',
    answerYes: true,
  },
  {
    display: 'Heater / load resistor',
    prompt: 'Is a heater usually drawn as a diode?',
    answerYes: false,
    explain: 'Heaters are resistive loads and use resistor-like symbols.',
  },
]

const LOGIC_GATES: QuizItem[] = [
  { display: 'AND · inputs 1,1', prompt: 'Is the AND output 1?', answerYes: true },
  { display: 'AND · inputs 1,0', prompt: 'Is the AND output 1?', answerYes: false },
  { display: 'OR · inputs 0,0', prompt: 'Is the OR output 0?', answerYes: true },
  { display: 'OR · inputs 1,0', prompt: 'Is the OR output 1?', answerYes: true },
  { display: 'NOT · input 0', prompt: 'Is the NOT output 1?', answerYes: true },
  { display: 'NOT · input 1', prompt: 'Is the NOT output 0?', answerYes: true },
  { display: 'NAND · inputs 1,1', prompt: 'Is the NAND output 0?', answerYes: true },
  { display: 'NAND · inputs 0,1', prompt: 'Is the NAND output 1?', answerYes: true },
  { display: 'NOR · inputs 0,0', prompt: 'Is the NOR output 1?', answerYes: true },
  { display: 'XOR · inputs 1,0', prompt: 'Is the XOR output 1?', answerYes: true },
  { display: 'XOR · inputs 1,1', prompt: 'Is the XOR output 0?', answerYes: true },
  { display: 'XOR · inputs 0,0', prompt: 'Is the XOR output 1?', answerYes: false },
  { display: 'Binary 1010', prompt: 'Is 1010₂ equal to 10₁₀?', answerYes: true },
  { display: 'Binary 0111', prompt: 'Is 0111₂ equal to 8₁₀?', answerYes: false },
  { display: 'Active-high reset', prompt: 'Does active-high mean logic 1 asserts the signal?', answerYes: true },
  { display: 'Pull-up resistor', prompt: 'Does a pull-up hold an open input high?', answerYes: true },
  { display: 'Debounce', prompt: 'Can switch bounce create false multiple edges?', answerYes: true },
  { display: 'Clocked FF', prompt: 'Does a flip-flop typically store one bit?', answerYes: true },
  { display: 'Tri-state output', prompt: 'Can a tri-state pin float (high-Z)?', answerYes: true },
  { display: 'AND vs OR', prompt: 'Is AND output 1 when any input is 1?', answerYes: false },
  {
    display: 'AND · inputs 0,0',
    prompt: 'Is the AND output 1?',
    answerYes: false,
    explain: 'AND is 1 only when every input is 1.',
  },
  {
    display: 'OR · inputs 1,1',
    prompt: 'Is the OR output 0?',
    answerYes: false,
    explain: 'OR is 1 if any input is 1; here both are 1.',
  },
  {
    display: 'NOR · inputs 1,0',
    prompt: 'Is the NOR output 1?',
    answerYes: false,
    explain: 'NOR is the opposite of OR; OR would be 1, so NOR is 0.',
  },
  {
    display: 'NAND · inputs 0,0',
    prompt: 'Is the NAND output 0?',
    answerYes: false,
    explain: 'NAND is 0 only when all inputs are 1; here output is 1.',
  },
  {
    display: 'XNOR · inputs 1,1',
    prompt: 'Is the XNOR output 0?',
    answerYes: false,
    explain: 'XNOR is 1 when inputs are equal.',
  },
  {
    display: 'XNOR · inputs 1,0',
    prompt: 'Is the XNOR output 1?',
    answerYes: false,
    explain: 'Inputs differ, so XNOR is 0 (XOR would be 1).',
  },
  {
    display: 'Binary 1100',
    prompt: 'Is 1100₂ equal to 10₁₀?',
    answerYes: false,
    explain: '1100₂ is 8 + 4 = 12.',
  },
  {
    display: 'Binary 0010',
    prompt: 'Is 0010₂ equal to 4₁₀?',
    answerYes: false,
    explain: '0010₂ is 2 in decimal.',
  },
  {
    display: 'Pull-down resistor',
    prompt: 'Does a pull-down hold an open input high?',
    answerYes: false,
    explain: 'Pull-down holds the pin low; pull-up holds it high.',
  },
  {
    display: 'Active-low enable',
    prompt: 'Does active-low mean logic 1 asserts the signal?',
    answerYes: false,
  },
  {
    display: 'Buffer gate',
    prompt: 'Does a buffer invert the logic level?',
    answerYes: false,
    explain: 'A buffer copies the level; NOT inverts it.',
  },
  {
    display: 'OR · inputs 0,1',
    prompt: 'Is the OR output 0?',
    answerYes: false,
    explain: 'One input is 1, so OR output is 1.',
  },
  {
    display: 'Bit',
    prompt: 'Is one bit either 0 or 1?',
    answerYes: true,
  },
  {
    display: 'Byte',
    prompt: 'Is one byte equal to 16 bits?',
    answerYes: false,
    explain: 'One byte is 8 bits.',
  },
  {
    display: 'Latch vs combo',
    prompt: 'Does a plain AND gate store a bit after inputs change?',
    answerYes: false,
    explain: 'Latches and flip-flops store state; gates alone do not.',
  },
  {
    display: 'XOR · inputs 0,1',
    prompt: 'Is the XOR output 0?',
    answerYes: false,
    explain: 'XOR is 1 when inputs differ.',
  },
  {
    display: 'De Morgan idea',
    prompt: 'Is NOT(A AND B) the same as (NOT A) AND (NOT B)?',
    answerYes: false,
    explain: 'NOT(A AND B) equals (NOT A) OR (NOT B).',
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
