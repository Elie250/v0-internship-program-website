export type EmployerReportOrganization = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  logoDataUrl: string | null
  description: string | null
}

export type InterviewStageReportCandidate = {
  applicationId: string
  name: string
  email: string
  phone: string | null
  location: string | null
  headline: string | null
  summary: string | null
  description: string
  skills: string[]
  jobTitle: string
  submittedAt: string
  technicalScore: number | null
  passed: boolean | null
  screeningLabel: string
  integrityBand: string | null
  integrityNote: string
  interviewMarksLabel: string
}

export type InterviewStageReport = {
  organization: EmployerReportOrganization
  generatedAt: string
  candidateCount: number
  candidates: InterviewStageReportCandidate[]
}

export type InterviewResultMark = {
  criterion: string
  score: number | null
}

export type InterviewResultsRow = {
  interviewId: string
  applicationId: string
  name: string
  email: string
  jobTitle: string
  interviewType: string
  interviewStatus: string
  scheduledAt: string
  criteriaMarks: InterviewResultMark[]
  marksLabel: string
  overallRating: number | null
  overallLabel: string
  recommendation: string | null
  recommendationLabel: string
  scorecardCount: number
  feedback: string | null
}

export type InterviewResultsReport = {
  organization: EmployerReportOrganization
  generatedAt: string
  criteria: string[]
  rowCount: number
  rows: InterviewResultsRow[]
}
