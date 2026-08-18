import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { getOrganizationById } from '@/lib/recruitment/organizations'
import { parsePositiveInt, sanitizeRecruitmentSearchTerm } from '@/lib/recruitment/query-utils'
import {
  isRecruitmentEmploymentType,
  isRecruitmentJobStatus,
  isRecruitmentJobVisibility,
  isRecruitmentWorkMode,
  slugifyJobTitle,
  type RecruitmentJob,
  type RecruitmentJobStatus,
  type RecruitmentJobVisibility,
  type RecruitmentJobWithOrganization,
} from '@/lib/recruitment/types'

export {
  applicationClosedReason,
  formatApplicationDeadlineLabel,
  isJobAcceptingApplications,
  serializeApplicationDeadlineInput,
  toDatetimeLocalValue,
} from '@/lib/recruitment/job-deadline'

async function revalidatePublicJobPages(organizationId: string, jobSlug: string) {
  const { organization } = await getOrganizationById(organizationId)
  revalidatePath('/jobs')
  revalidatePath('/api/recruitment/public/jobs')
  if (!organization?.slug) return
  revalidatePath(`/o/${organization.slug}`)
  revalidatePath(`/o/${organization.slug}/jobs/${jobSlug}`)
  revalidatePath(`/o/${organization.slug}/jobs/${jobSlug}/apply`)
  revalidatePath(`/api/recruitment/public/jobs/${organization.slug}/${jobSlug}`)
}

const JOB_SELECT =
  'id, organization_id, title, slug, description, responsibilities, requirements, qualifications, location, employment_type, work_mode, category, department, skills, salary_min, salary_max, salary_currency, salary_visible, visibility, status, published_at, application_deadline, created_at, updated_at'

const PUBLIC_JOB_CARD_SELECT =
  'id, title, slug, description, location, employment_type, work_mode, category, status, published_at, application_deadline, organization:recruitment_organizations!inner(name, slug, logo_url, status)'

const PUBLIC_JOB_DETAIL_SELECT =
  'id, title, slug, description, responsibilities, requirements, qualifications, location, employment_type, work_mode, category, status, published_at, application_deadline, organization:recruitment_organizations!inner(name, slug, logo_url, status)'

export type PublicJobListFilters = {
  search?: string
  organizationSlug?: string
  location?: string
  employmentType?: string
  category?: string
  page?: number
  pageSize?: number
}

async function getActiveOrganizationIdBySlug(slug: string): Promise<string | null> {
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin
    .from('recruitment_organizations')
    .select('id')
    .eq('slug', slug.trim().toLowerCase())
    .eq('status', 'active')
    .maybeSingle()
  return data?.id ?? null
}

export async function listPublicJobs(filters: PublicJobListFilters = {}): Promise<{
  jobs: RecruitmentJobWithOrganization[]
  total: number
  page: number
  pageSize: number
  error?: string
}> {
  if (!supabaseAdmin) return { jobs: [], total: 0, page: 1, pageSize: 20, error: 'Database not configured' }

  const page = parsePositiveInt(String(filters.page ?? 1), 1, 100)
  const pageSize = parsePositiveInt(String(filters.pageSize ?? 20), 20, 50)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabaseAdmin
    .from('recruitment_jobs')
    .select(PUBLIC_JOB_CARD_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('organization.status', 'active')
    .order('published_at', { ascending: false })
    .range(from, to)

  if (filters.organizationSlug?.trim()) {
    const orgId = await getActiveOrganizationIdBySlug(filters.organizationSlug)
    if (!orgId) return { jobs: [], total: 0, page, pageSize }
    query = query.eq('organization_id', orgId)
  }

  if (filters.location?.trim()) {
    const loc = sanitizeRecruitmentSearchTerm(filters.location)
    if (loc) query = query.ilike('location', `%${loc}%`)
  }

  if (filters.employmentType?.trim() && isRecruitmentEmploymentType(filters.employmentType)) {
    query = query.eq('employment_type', filters.employmentType)
  }

  if (filters.category?.trim()) {
    const cat = sanitizeRecruitmentSearchTerm(filters.category)
    if (cat) query = query.ilike('category', `%${cat}%`)
  }

  if (filters.search?.trim()) {
    const term = sanitizeRecruitmentSearchTerm(filters.search)
    if (term) {
      query = query.or(
        `title.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%,category.ilike.%${term}%`
      )
    }
  }

  const { data, error, count } = await query
  if (error) return { jobs: [], total: 0, page, pageSize, error: error.message }

  return {
    jobs: (data ?? []) as unknown as RecruitmentJobWithOrganization[],
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function getPublicJobBySlugs(
  orgSlug: string,
  jobSlug: string
): Promise<{ job: RecruitmentJobWithOrganization | null; error?: string }> {
  if (!supabaseAdmin) return { job: null, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_jobs')
    .select(PUBLIC_JOB_DETAIL_SELECT)
    .eq('slug', jobSlug.trim().toLowerCase())
    .eq('status', 'published')
    .eq('organization.slug', orgSlug.trim().toLowerCase())
    .eq('organization.status', 'active')
    .maybeSingle()

  if (error) return { job: null, error: error.message }
  return { job: (data as unknown as RecruitmentJobWithOrganization | null) ?? null }
}

export async function getJobById(
  id: string
): Promise<{ job: RecruitmentJob | null; error?: string }> {
  if (!supabaseAdmin) return { job: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_jobs')
    .select(JOB_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) return { job: null, error: error.message }
  return { job: (data as RecruitmentJob | null) ?? null }
}

export async function getJobByIdWithOrganization(id: string): Promise<{
  job: RecruitmentJobWithOrganization | null
  error?: string
}> {
  if (!supabaseAdmin) return { job: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_jobs')
    .select(`${JOB_SELECT}, organization:recruitment_organizations(id, name, slug, logo_url, status)`)
    .eq('id', id)
    .maybeSingle()
  if (error) return { job: null, error: error.message }
  return { job: (data as unknown as RecruitmentJobWithOrganization | null) ?? null }
}

export async function listOrganizationJobs(
  organizationId: string,
  options?: { jobIds?: string[] | null }
): Promise<{
  jobs: RecruitmentJob[]
  error?: string
}> {
  if (!supabaseAdmin) return { jobs: [], error: 'Database not configured' }
  if (options?.jobIds && options.jobIds.length === 0) return { jobs: [] }

  let query = supabaseAdmin
    .from('recruitment_jobs')
    .select(JOB_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (options?.jobIds && options.jobIds.length > 0) {
    query = query.in('id', options.jobIds)
  }

  const { data, error } = await query
  if (error) return { jobs: [], error: error.message }
  return { jobs: (data ?? []) as RecruitmentJob[] }
}

export async function listPublicJobFilterOptions(): Promise<{
  organizations: Array<{ name: string; slug: string }>
  locations: string[]
  categories: string[]
  employmentTypes: string[]
  error?: string
}> {
  if (!supabaseAdmin) {
    return { organizations: [], locations: [], categories: [], employmentTypes: [], error: 'Database not configured' }
  }

  const { data, error } = await supabaseAdmin
    .from('recruitment_jobs')
    .select(
      'location, employment_type, category, organization:recruitment_organizations!inner(name, slug, status)'
    )
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('organization.status', 'active')

  if (error) {
    return { organizations: [], locations: [], categories: [], employmentTypes: [], error: error.message }
  }

  const orgMap = new Map<string, { name: string; slug: string }>()
  const locations = new Set<string>()
  const categories = new Set<string>()
  const employmentTypes = new Set<string>()

  for (const row of data ?? []) {
    const org = Array.isArray(row.organization) ? row.organization[0] : row.organization
    if (org?.slug && org?.name) orgMap.set(org.slug, { name: org.name, slug: org.slug })
    if (row.location?.trim()) locations.add(row.location.trim())
    if (row.category?.trim()) categories.add(row.category.trim())
    if (row.employment_type) employmentTypes.add(row.employment_type)
  }

  return {
    organizations: Array.from(orgMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    locations: Array.from(locations).sort(),
    categories: Array.from(categories).sort(),
    employmentTypes: Array.from(employmentTypes).sort(),
  }
}

function parseJobSkills(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 40)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 40)
  }
  return []
}

export async function getOrganizationJob(
  jobId: string,
  organizationId: string
): Promise<{ job: RecruitmentJob | null; error?: string }> {
  if (!supabaseAdmin) return { job: null, error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_jobs')
    .select(JOB_SELECT)
    .eq('id', jobId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) return { job: null, error: error.message }
  return { job: (data as RecruitmentJob | null) ?? null }
}

export async function createOrganizationJob(input: {
  organizationId: string
  title: string
  slug?: string
  description?: string
  responsibilities?: string
  requirements?: string
  qualifications?: string
  location?: string
  employmentType?: string
  workMode?: string
  category?: string
  department?: string
  skills?: unknown
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  salaryVisible?: boolean
  visibility?: string
  status?: RecruitmentJobStatus
  applicationDeadline?: string | null
  actorUserId?: string | null
}): Promise<{ job?: RecruitmentJob; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const title = input.title.trim()
  if (!title) return { error: 'Job title is required' }

  const slug = (input.slug?.trim() || slugifyJobTitle(title)).toLowerCase()
  const status =
    input.status && isRecruitmentJobStatus(input.status) ? input.status : 'draft'
  const visibility: RecruitmentJobVisibility =
    input.visibility && isRecruitmentJobVisibility(input.visibility)
      ? input.visibility
      : 'public'

  const employmentType =
    input.employmentType && isRecruitmentEmploymentType(input.employmentType)
      ? input.employmentType
      : null
  const workMode =
    input.workMode && isRecruitmentWorkMode(input.workMode) ? input.workMode : null

  const publishedAt = status === 'published' ? new Date().toISOString() : null

  const { data, error } = await supabaseAdmin
    .from('recruitment_jobs')
    .insert([
      {
        organization_id: input.organizationId,
        title,
        slug,
        description: input.description?.trim() || null,
        responsibilities: input.responsibilities?.trim() || null,
        requirements: input.requirements?.trim() || null,
        qualifications: input.qualifications?.trim() || null,
        location: input.location?.trim() || null,
        employment_type: employmentType,
        work_mode: workMode,
        category: input.category?.trim() || null,
        department: input.department?.trim() || null,
        skills: parseJobSkills(input.skills),
        salary_min: input.salaryMin ?? null,
        salary_max: input.salaryMax ?? null,
        salary_currency: input.salaryCurrency?.trim() || null,
        salary_visible: Boolean(input.salaryVisible),
        visibility,
        status,
        published_at: publishedAt,
        application_deadline: input.applicationDeadline || null,
      },
    ])
    .select(JOB_SELECT)
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'job_created',
    entityType: 'recruitment_jobs',
    entityId: data.id,
    metadata: { title, slug, status },
  })

  await revalidatePublicJobPages(input.organizationId, slug)
  return { job: data as RecruitmentJob }
}

export async function getPublishedJobRecordBySlugs(
  orgSlug: string,
  jobSlug: string
): Promise<{ job: (RecruitmentJob & { organization?: { name: string; slug: string; logo_url: string | null; status: string } | null }) | null; error?: string }> {
  if (!supabaseAdmin) return { job: null, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('recruitment_jobs')
    .select(`${JOB_SELECT}, organization:recruitment_organizations!inner(name, slug, logo_url, status)`)
    .eq('slug', jobSlug.trim().toLowerCase())
    .eq('status', 'published')
    .eq('organization.slug', orgSlug.trim().toLowerCase())
    .eq('organization.status', 'active')
    .maybeSingle()

  if (error) return { job: null, error: error.message }
  return { job: (data as unknown as RecruitmentJob & { organization?: { name: string; slug: string; logo_url: string | null; status: string } | null }) ?? null }
}

export async function updateOrganizationJob(input: {
  jobId: string
  organizationId: string
  title?: string
  slug?: string
  description?: string | null
  responsibilities?: string | null
  requirements?: string | null
  qualifications?: string | null
  location?: string | null
  employmentType?: string | null
  workMode?: string | null
  category?: string | null
  department?: string | null
  skills?: unknown
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  salaryVisible?: boolean
  visibility?: string
  status?: RecruitmentJobStatus
  applicationDeadline?: string | null
  actorUserId?: string | null
}): Promise<{ job?: RecruitmentJob; error?: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.title !== undefined) updates.title = input.title.trim()
  if (input.slug !== undefined) updates.slug = input.slug.trim().toLowerCase()
  if (input.description !== undefined) updates.description = input.description?.trim() || null
  if (input.responsibilities !== undefined) {
    updates.responsibilities = input.responsibilities?.trim() || null
  }
  if (input.requirements !== undefined) updates.requirements = input.requirements?.trim() || null
  if (input.qualifications !== undefined) {
    updates.qualifications = input.qualifications?.trim() || null
  }
  if (input.location !== undefined) updates.location = input.location?.trim() || null
  if (input.category !== undefined) updates.category = input.category?.trim() || null
  if (input.department !== undefined) updates.department = input.department?.trim() || null
  if (input.skills !== undefined) updates.skills = parseJobSkills(input.skills)
  if (input.salaryMin !== undefined) updates.salary_min = input.salaryMin
  if (input.salaryMax !== undefined) updates.salary_max = input.salaryMax
  if (input.salaryCurrency !== undefined) {
    updates.salary_currency = input.salaryCurrency?.trim() || null
  }
  if (input.salaryVisible !== undefined) updates.salary_visible = Boolean(input.salaryVisible)
  if (input.visibility !== undefined) {
    if (!isRecruitmentJobVisibility(input.visibility)) return { error: 'Invalid visibility' }
    updates.visibility = input.visibility
  }
  if (input.applicationDeadline !== undefined) {
    updates.application_deadline = input.applicationDeadline || null
  }
  if (input.employmentType !== undefined) {
    if (input.employmentType && !isRecruitmentEmploymentType(input.employmentType)) {
      return { error: 'Invalid employment type' }
    }
    updates.employment_type = input.employmentType || null
  }
  if (input.workMode !== undefined) {
    if (input.workMode && !isRecruitmentWorkMode(input.workMode)) {
      return { error: 'Invalid work mode' }
    }
    updates.work_mode = input.workMode || null
  }
  if (input.status !== undefined) {
    if (!isRecruitmentJobStatus(input.status)) return { error: 'Invalid status' }
    updates.status = input.status
    if (input.status === 'published') {
      updates.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabaseAdmin
    .from('recruitment_jobs')
    .update(updates)
    .eq('id', input.jobId)
    .eq('organization_id', input.organizationId)
    .select(JOB_SELECT)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Job not found' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'job_updated',
    entityType: 'recruitment_jobs',
    entityId: data.id,
    metadata: { status: data.status, slug: data.slug },
  })

  await revalidatePublicJobPages(input.organizationId, data.slug)
  return { job: data as RecruitmentJob }
}
