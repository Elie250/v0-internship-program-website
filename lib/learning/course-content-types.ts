export const COURSE_CONTENT_TYPES = [
  { value: 'video', label: 'Video (YouTube, Vimeo, or MP4 link)' },
  { value: 'webinar', label: 'Live webinar / meeting link' },
  { value: 'pdf', label: 'PDF document' },
  { value: 'document', label: 'Document / slides' },
  { value: 'link', label: 'External resource link' },
  { value: 'download', label: 'Downloadable file' },
] as const

export type CourseContentType = (typeof COURSE_CONTENT_TYPES)[number]['value']

export function isCourseContentType(value: string): value is CourseContentType {
  return COURSE_CONTENT_TYPES.some((t) => t.value === value)
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
    default:
      return 'https://...'
  }
}
