/** YES/NO item banks for engineering fundamentals drills. */

export type QuizItem = {
  /** Main question (YES/NO) */
  prompt: string
  /** Large visual / formula / snippet */
  display: string
  /** true => correct answer is YES */
  answerYes: boolean
}

export type QuizBankId =
  | 'ohm-law'
  | 'circuit-symbols'
  | 'logic-gates'
  | 'plc-ladder'
  | 'code-trace'

const OHM_LAW: QuizItem[] = [
  { display: 'V = 12 V · R = 4 Ω', prompt: 'Is the current I = 3 A?', answerYes: true },
  { display: 'V = 24 V · R = 8 Ω', prompt: 'Is the current I = 2 A?', answerYes: true },
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
]

const BANKS: Record<QuizBankId, QuizItem[]> = {
  'ohm-law': OHM_LAW,
  'circuit-symbols': CIRCUIT_SYMBOLS,
  'logic-gates': LOGIC_GATES,
  'plc-ladder': PLC_LADDER,
  'code-trace': CODE_TRACE,
}

export function getQuizBank(id: QuizBankId): QuizItem[] {
  return BANKS[id] ?? []
}

export function pickQuizRound(bankId: QuizBankId, count: number): QuizItem[] {
  const source = [...getQuizBank(bankId)]
  for (let i = source.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[source[i], source[j]] = [source[j]!, source[i]!]
  }
  if (source.length === 0) return []
  const out: QuizItem[] = []
  while (out.length < count) {
    out.push(...source)
  }
  return out.slice(0, count)
}
