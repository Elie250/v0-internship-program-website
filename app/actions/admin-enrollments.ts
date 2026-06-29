'use server'

import { requireAdminPermission, getAdminSession } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { revokeEnrollmentWithPayment } from '@/lib/admin/refund-payment'

export async function revokeStudentEnrollmentAccess(input: {
  enrollmentId: string
  adminNotes?: string
  deleteReceipt?: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    const session = await getAdminSession()
    return revokeEnrollmentWithPayment(input.enrollmentId, {
      adminNotes: input.adminNotes,
      deleteReceipt: input.deleteReceipt ?? true,
      reviewedBy: session?.user.id ?? null,
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke access',
    }
  }
}
