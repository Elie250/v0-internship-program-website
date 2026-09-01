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
  jobTitle: string
  screeningLabel: string
  integrityLabel: string
}

export type InterviewPlacementRow = {
  interviewId: string
  applicationId: string
  when: string
  name: string
  jobTitle: string
  interviewType: string
  place: string
  status: string
  duration: string
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

export type InterviewPlacementReport = {
  organization: EmployerReportOrganization
  generatedAt: string
  rowCount: number
  rows: InterviewPlacementRow[]
}
