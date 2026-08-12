import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import {
  isRecruitmentQuestionDifficulty,
  isRecruitmentQuestionType,
  type RecruitmentQuestionType,
} from '@/lib/recruitment/types'

const ORG_QUESTION_SELECT =
  'id, owner_type, organization_id, discipline, difficulty, prompt, expected_time_seconds, answer_key, question_type, options, parameters, answer_spec, weight, section, status, created_at, updated_at'

const PLATFORM_QUESTION_SELECT =
  'id, owner_type, organization_id, discipline, difficulty, prompt, expected_time_seconds, question_type, options, parameters, weight, section, status, created_at, updated_at'

export async function listAvailableQuestions(organizationId: string) {
  if (!supabaseAdmin) return { questions: [], error: 'Database not configured' }

  const [{ data: platform, error: platformError }, { data: org, error: orgError }] =
    await Promise.all([
      supabaseAdmin
        .from('recruitment_questions')
        .select(PLATFORM_QUESTION_SELECT)
        .eq('owner_type', 'platform')
        .neq('status', 'archived')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('recruitment_questions')
        .select(ORG_QUESTION_SELECT)
        .eq('owner_type', 'organization')
        .eq('organization_id', organizationId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false }),
    ])

  if (platformError) return { questions: [], error: platformError.message }
  if (orgError) return { questions: [], error: orgError.message }

  return {
    questions: [...(org ?? []), ...(platform ?? [])],
  }
}

function parseQuestionType(value: unknown): RecruitmentQuestionType {
  const raw = String(value ?? 'short_text')
  return isRecruitmentQuestionType(raw) ? raw : 'short_text'
}

export async function createOrganizationQuestion(input: {
  organizationId: string
  actorUserId: string
  prompt: string
  discipline?: string
  difficulty?: string
  expectedTimeSeconds?: number | null
  answerKey?: string | null
  questionType?: string
  options?: unknown
  parameters?: unknown
  answerSpec?: unknown
  weight?: number
  section?: string | null
}): Promise<{ question?: Record<string, unknown>; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const prompt = input.prompt.trim()
  if (!prompt) return { error: 'Question prompt is required' }

  const difficulty =
    input.difficulty && isRecruitmentQuestionDifficulty(input.difficulty)
      ? input.difficulty
      : null

  const { data, error } = await supabaseAdmin
    .from('recruitment_questions')
    .insert([
      {
        owner_type: 'organization',
        organization_id: input.organizationId,
        prompt,
        discipline: input.discipline?.trim() || null,
        difficulty,
        expected_time_seconds: input.expectedTimeSeconds ?? null,
        answer_key: input.answerKey?.trim() || null,
        question_type: parseQuestionType(input.questionType),
        options: Array.isArray(input.options) ? input.options : [],
        parameters: Array.isArray(input.parameters) ? input.parameters : [],
        answer_spec:
          input.answerSpec && typeof input.answerSpec === 'object' ? input.answerSpec : {},
        weight: input.weight != null && Number(input.weight) > 0 ? Number(input.weight) : 1,
        section: input.section?.trim() || input.discipline?.trim() || null,
        created_by: input.actorUserId,
      },
    ])
    .select(ORG_QUESTION_SELECT)
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'question_created',
    entityType: 'recruitment_questions',
    entityId: data.id,
    metadata: { ownerType: 'organization', questionType: data.question_type },
  })

  return { question: data as Record<string, unknown> }
}

export async function updateOrganizationQuestion(input: {
  questionId: string
  organizationId: string
  actorUserId: string
  prompt?: string
  discipline?: string | null
  difficulty?: string | null
  expectedTimeSeconds?: number | null
  answerKey?: string | null
  questionType?: string
  options?: unknown
  parameters?: unknown
  answerSpec?: unknown
  weight?: number
  section?: string | null
}): Promise<{ question?: Record<string, unknown>; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.prompt !== undefined) updates.prompt = input.prompt.trim()
  if (input.discipline !== undefined) updates.discipline = input.discipline?.trim() || null
  if (input.difficulty !== undefined) {
    if (input.difficulty && !isRecruitmentQuestionDifficulty(input.difficulty)) {
      return { error: 'Invalid difficulty' }
    }
    updates.difficulty = input.difficulty || null
  }
  if (input.expectedTimeSeconds !== undefined) {
    updates.expected_time_seconds = input.expectedTimeSeconds
  }
  if (input.answerKey !== undefined) updates.answer_key = input.answerKey?.trim() || null
  if (input.questionType !== undefined) updates.question_type = parseQuestionType(input.questionType)
  if (input.options !== undefined) updates.options = Array.isArray(input.options) ? input.options : []
  if (input.parameters !== undefined) {
    updates.parameters = Array.isArray(input.parameters) ? input.parameters : []
  }
  if (input.answerSpec !== undefined) {
    updates.answer_spec =
      input.answerSpec && typeof input.answerSpec === 'object' ? input.answerSpec : {}
  }
  if (input.weight !== undefined) {
    updates.weight = input.weight != null && Number(input.weight) > 0 ? Number(input.weight) : 1
  }
  if (input.section !== undefined) updates.section = input.section?.trim() || null

  const { data, error } = await supabaseAdmin
    .from('recruitment_questions')
    .update(updates)
    .eq('id', input.questionId)
    .eq('owner_type', 'organization')
    .eq('organization_id', input.organizationId)
    .select(ORG_QUESTION_SELECT)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Question not found' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'question_updated',
    entityType: 'recruitment_questions',
    entityId: data.id,
  })

  return { question: data as Record<string, unknown> }
}

export async function deleteOrganizationQuestion(input: {
  questionId: string
  organizationId: string
  actorUserId: string
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_questions')
    .delete()
    .eq('id', input.questionId)
    .eq('owner_type', 'organization')
    .eq('organization_id', input.organizationId)
    .select('id')
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: 'Question not found' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'question_deleted',
    entityType: 'recruitment_questions',
    entityId: data.id,
  })

  return { success: true }
}
