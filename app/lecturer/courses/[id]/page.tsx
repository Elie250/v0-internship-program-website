import { LecturerCourseWorkspace } from '@/components/lecturer/lecturer-course-workspace'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function LecturerCoursePage({ params }: PageProps) {
  const { id } = await params
  return <LecturerCourseWorkspace courseId={id} />
}
