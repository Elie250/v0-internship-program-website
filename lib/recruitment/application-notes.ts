import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { getOrganizationApplication } from '@/lib/recruitment/employer-applications'

export async function listApplicationNotes(applicationId: string, organizationId: string) {
  if (!supabaseAdmin) return { notes: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_application_notes')
    .select('id, application_id, organization_id, author_user_id, body, created_at, updated_at')
    .eq('application_id', applicationId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) return { notes: [], error: error.message }
  return { notes: data ?? [] }
}

export async function addApplicationNote(input: {
  applicationId: string
  organizationId: string
  authorUserId: string
  body: string
}): Promise<{ note?: Record<string, unknown>; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const body = input.body.trim()
  if (!body) return { error: 'Note cannot be empty' }
  if (body.length > 8000) return { error: 'Note is too long' }

  const { application, error: appError } = await getOrganizationApplication(
    input.applicationId,
    input.organizationId
  )
  if (appError) return { error: appError }
  if (!application) return { error: 'Application not found' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_application_notes')
    .insert([
      {
        application_id: input.applicationId,
        organization_id: input.organizationId,
        author_user_id: input.authorUserId,
        body,
      },
    ])
    .select('id, application_id, organization_id, author_user_id, body, created_at, updated_at')
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.authorUserId,
    organizationId: input.organizationId,
    action: 'application_note_added',
    entityType: 'recruitment_application_notes',
    entityId: data.id,
    metadata: { applicationId: input.applicationId },
  })

  return { note: data as Record<string, unknown> }
}
