import { createSignedGetUrl, storageConfigured, uploadObject } from '@/lib/storage/object-storage'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { recruitmentCandidateCvObjectKey } from '@/lib/recruitment/storage-paths'
import type { RecruitmentDocument } from '@/lib/recruitment/types'

const DOCUMENT_SELECT =
  'id, candidate_user_id, application_id, document_type, storage_key, original_filename, mime_type, size_bytes, scan_status, created_at, deleted_at'

export const CV_MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const CV_ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const CV_ALLOWED_EXT = new Set(['pdf', 'doc', 'docx'])

export function validateCvUpload(input: {
  filename: string
  mimeType: string
  sizeBytes: number
  buffer: Buffer
}): { ok: true } | { ok: false; error: string } {
  if (input.sizeBytes <= 0 || input.sizeBytes > CV_MAX_BYTES) {
    return { ok: false, error: 'CV must be between 1 byte and 10 MB.' }
  }

  const ext = input.filename.split('.').pop()?.toLowerCase() ?? ''
  if (!CV_ALLOWED_EXT.has(ext)) {
    return { ok: false, error: 'Upload a PDF or Word document (.pdf, .doc, .docx).' }
  }

  if (!CV_ALLOWED_MIME.has(input.mimeType)) {
    return { ok: false, error: 'Unsupported file type. Upload PDF or Word only.' }
  }

  // PDF magic bytes: %PDF
  if (ext === 'pdf' && !input.buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
    return { ok: false, error: 'File does not appear to be a valid PDF.' }
  }

  // DOCX is ZIP-based (PK..)
  if (ext === 'docx' && !input.buffer.subarray(0, 2).equals(Buffer.from('PK'))) {
    return { ok: false, error: 'File does not appear to be a valid DOCX.' }
  }

  return { ok: true }
}

export async function listCandidateDocuments(candidateUserId: string): Promise<{
  documents: RecruitmentDocument[]
  error?: string
}> {
  if (!supabaseAdmin) return { documents: [], error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_documents')
    .select(DOCUMENT_SELECT)
    .eq('candidate_user_id', candidateUserId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return { documents: [], error: error.message }
  return { documents: (data ?? []) as RecruitmentDocument[] }
}

export async function getCandidateDocument(
  documentId: string,
  candidateUserId: string
): Promise<{ document: RecruitmentDocument | null; error?: string }> {
  if (!supabaseAdmin) return { document: null, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_documents')
    .select(DOCUMENT_SELECT)
    .eq('id', documentId)
    .eq('candidate_user_id', candidateUserId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return { document: null, error: error.message }
  return { document: (data as RecruitmentDocument | null) ?? null }
}

export async function uploadCandidateCv(input: {
  candidateUserId: string
  filename: string
  mimeType: string
  buffer: Buffer
  actorUserId: string
}): Promise<{ document?: RecruitmentDocument; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  if (!storageConfigured()) return { error: 'Document storage is not configured.' }

  const validation = validateCvUpload({
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.buffer.length,
    buffer: input.buffer,
  })
  if (!validation.ok) return { error: validation.error }

  const storageKey = recruitmentCandidateCvObjectKey(input.candidateUserId, input.filename)
  await uploadObject(storageKey, input.buffer, input.mimeType)

  const { data, error } = await supabaseAdmin
    .from('recruitment_documents')
    .insert([
      {
        candidate_user_id: input.candidateUserId,
        document_type: 'cv',
        storage_key: storageKey,
        original_filename: input.filename.slice(0, 255),
        mime_type: input.mimeType,
        size_bytes: input.buffer.length,
        scan_status: 'pending',
      },
    ])
    .select(DOCUMENT_SELECT)
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    action: 'cv_uploaded',
    entityType: 'recruitment_documents',
    entityId: data.id,
    metadata: { documentType: 'cv', sizeBytes: input.buffer.length },
  })

  return { document: data as RecruitmentDocument }
}

export async function softDeleteCandidateDocument(input: {
  documentId: string
  candidateUserId: string
  actorUserId: string
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.documentId)
    .eq('candidate_user_id', input.candidateUserId)
    .is('deleted_at', null)
    .select('id, document_type')
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: 'Document not found' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    action: 'cv_deleted',
    entityType: 'recruitment_documents',
    entityId: data.id,
    metadata: { documentType: data.document_type },
  })

  return { success: true }
}

export async function createCandidateDocumentDownloadUrl(input: {
  documentId: string
  candidateUserId: string
}): Promise<{ url?: string; error?: string }> {
  const { document, error } = await getCandidateDocument(input.documentId, input.candidateUserId)
  if (error) return { error }
  if (!document) return { error: 'Document not found' }

  try {
    const url = await createSignedGetUrl(document.storage_key, 900)
    return { url }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not create download link' }
  }
}
