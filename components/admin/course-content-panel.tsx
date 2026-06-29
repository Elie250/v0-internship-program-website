'use client'

import { CourseLessonManager } from '@/components/learning/course-lesson-manager'

export function CourseContentPanel({ courseId }: { courseId: string }) {
  return (
    <div className="border-t pt-4">
      <p className="font-medium text-sm mb-3">Course lessons (visible to admitted students)</p>
      <CourseLessonManager courseId={courseId} mode="admin" />
    </div>
  )
}
