import { lessonTypeRequiresUrl } from '@/lib/learning/lesson-authoring-rules'

export const COURSE_CONTENT_TYPES = [
  { value: 'video', label: 'Video (YouTube, Vimeo, or MP4 link)' },
  { value: 'webinar', label: 'Live webinar / meeting link' },
  { value: 'pdf', label: 'PDF document' },
  { value: 'document', label: 'Document / slides' },
  { value: 'link', label: 'External resource link' },
  { value: 'download', label: 'Downloadable file' },
] as const

export const INTERACTIVE_CONTENT_TYPE = 'interactive' as const

export const INTERACTIVE_CONTENT_OPTION = {
  value: INTERACTIVE_CONTENT_TYPE,
  label: 'Interactive lesson (headings, diagrams, code)',
} as const

export type UrlCourseContentType = (typeof COURSE_CONTENT_TYPES)[number]['value']
export type CourseContentType = UrlCourseContentType | typeof INTERACTIVE_CONTENT_TYPE

export function isCourseContentType(value: string): value is CourseContentType {
  return (
    COURSE_CONTENT_TYPES.some((t) => t.value === value) || value === INTERACTIVE_CONTENT_TYPE
  )
}

export function requiresContentUrl(type: CourseContentType): boolean {
  return lessonTypeRequiresUrl(type)
}

export function contentUrlPlaceholder(type: CourseContentType): string {
  switch (type) {
    case 'video':
      return 'https://youtube.com/watch?v=... or https://.../lesson.mp4'
    case 'webinar':
      return 'https://zoom.us/j/... or https://meet.google.com/...'
    case 'pdf':
      return 'https://.../notes.pdf or upload a PDF below'
    case 'document':
      return 'https://.../slides.pptx or upload a file below'
    case 'download':
      return 'https://.../resource.zip'
    case 'interactive':
      return 'Optional supporting URL — lesson body can stand alone'
    default:
      return 'https://...'
  }
}
