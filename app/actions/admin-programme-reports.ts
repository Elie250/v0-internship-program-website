'use server'

import {
  getProgrammeReportEditor,
  listProgrammeReports,
  publishProgrammeReport,
  saveProgrammeReport,
  unpublishProgrammeReport,
} from '@/lib/admin/programme-reports'

export async function listProgrammeReportAction() {
  return listProgrammeReports()
}

export async function getProgrammeReportEditorAction(courseId: string) {
  return getProgrammeReportEditor(courseId)
}

export async function saveProgrammeReportAction(courseId: string, input: object) {
  return saveProgrammeReport(courseId, input)
}

export async function publishProgrammeReportAction(courseId: string) {
  return publishProgrammeReport(courseId)
}

export async function unpublishProgrammeReportAction(courseId: string) {
  return unpublishProgrammeReport(courseId)
}
