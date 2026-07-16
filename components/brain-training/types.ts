export type DrillPhase = 'intro' | 'warmup' | 'playing' | 'stage-gate' | 'result'

export type StageGateState = {
  passed: boolean
  level: number
  correct: number
  total: number
  accuracy: number
}
