/**
 * Phase C1 practical assessment contracts (no network / no DB writes).
 * Run: pnpm test:practical-assessments
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertPracticalTransition,
  canPublishPractical,
  CLEARED_PRACTICAL_GRADE_FIELDS,
  computePracticalScore,
  defaultDeliveryModeForKind,
  emptyPracticalBrief,
  nextStatusAfterStudentSubmit,
  parsePracticalBrief,
  passFromPercent,
  studentMayEditPractical,
  validateRubricForPublish,
} from '../lib/learning/practical-assessments.ts'
import {
  PRACTICAL_ALLOWED_EXTENSIONS,
  isAuthorizedPracticalStorageKey,
  validatePracticalUploadFile,
} from '../lib/learning/practical-upload.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const readSrc = (relative: string) => readFileSync(join(root, relative), 'utf8')

describe('Phase C migrations', () => {
  it('104 adds assessment_kind, delivery_mode, practical_brief with quiz backfill', () => {
    const sql = readSrc('scripts/104-practical-assessments-core.sql')
    assert.match(sql, /assessment_kind/)
    assert.match(sql, /delivery_mode/)
    assert.match(sql, /practical_brief/)
    assert.match(sql, /SET assessment_kind = 'quiz'/)
    assert.match(sql, /not_applicable/)
    assert.match(sql, /virtual_software/)
    assert.match(sql, /safety_notes/)
    assert.match(sql, /Deferred to C2: module_id/)
    assert.doesNotMatch(sql, /ADD COLUMN IF NOT EXISTS module_id/)
  })

  it('105 adds rubrics, artifacts, practical_status, integrity triggers and deny-direct RLS', () => {
    const sql = readSrc('scripts/105-assessment-rubrics-and-scores.sql')
    assert.match(sql, /assessment_rubrics/)
    assert.match(sql, /assessment_rubric_criteria/)
    assert.match(sql, /assessment_rubric_levels/)
    assert.match(sql, /assessment_submission_artifacts/)
    assert.match(sql, /assessment_criterion_scores/)
    assert.match(sql, /practical_status/)
    assert.match(sql, /no_direct_access/)
    assert.match(sql, /USING \(false\)/)
    assert.match(sql, /assessment_rubric_criteria_max_points_check/)
    assert.match(sql, /assessment_rubric_levels_points_check/)
    assert.match(sql, /enforce_rubric_level_points_within_criterion/)
    assert.match(sql, /enforce_criterion_score_integrity/)
    assert.match(sql, /level_id must belong to the same criterion/)
    assert.match(sql, /resubmit_practical_submission/)
    assert.match(sql, /FOR UPDATE/)
    assert.match(sql, /AND practical_status = 'returned'/)
    assert.match(sql, /GET DIAGNOSTICS v_updated = ROW_COUNT/)
    assert.match(sql, /mark_practical_submission/)
    assert.match(sql, /p_expected_status/)
    assert.match(sql, /NOTIFY pgrst/)
  })

  it('106 maps outcomes and bridges labs with same-course validation without auto-assigning history', () => {
    const sql = readSrc('scripts/106-assessment-outcomes-and-lab-bridge.sql')
    assert.match(sql, /assessment_outcome_links/)
    assert.match(sql, /curriculum_learning_outcomes/)
    assert.match(sql, /lab_submissions/)
    assert.match(sql, /assessment_id/)
    assert.match(sql, /Historical rows stay NULL/)
    assert.match(sql, /REQUIRES scripts\/103/)
    assert.match(sql, /enforce_lab_submission_assessment_same_course/)
    assert.match(sql, /assessment_outcome_links_assessment_outcome_null_criterion_uidx/)
    assert.match(sql, /to_regclass\('public\.curriculum_learning_outcomes'\)/)
    assert.match(sql, /NOTIFY pgrst/)
  })

  it('105b upgrade script exists for already-applied 105 databases', () => {
    const sql = readSrc('scripts/105b-practical-integrity-and-marking-rpcs.sql')
    assert.match(sql, /already applied/)
    assert.match(sql, /mark_practical_submission/)
    assert.match(sql, /resubmit_practical_submission/)
    assert.match(sql, /enforce_criterion_score_integrity/)
    assert.match(sql, /FOR UPDATE/)
  })

  it('verify-phase-c1-practicals.sql documents read-only dependency checks including 104', () => {
    const sql = readSrc('scripts/verify-phase-c1-practicals.sql')
    assert.match(sql, /curriculum_learning_outcomes/)
    assert.match(sql, /migration_104_status/)
    assert.match(sql, /assessment_kind/)
    assert.match(sql, /delivery_mode/)
    assert.match(sql, /practical_brief/)
    assert.match(sql, /INCOMPLETE/)
    assert.match(sql, /MISSING_BEFORE_106_OR_NOT_APPLIED/)
    assert.match(sql, /assessment_rubric_criteria/)
    assert.match(sql, /lab_submissions/)
    assert.match(sql, /mark_practical_submission/)
    assert.match(sql, /Do not apply migrations/)
  })
})

describe('practical brief and publish gates', () => {
  it('parses versioned briefs including safety_notes distinct from delivery_notes', () => {
    const parsed = parsePracticalBrief({
      version: 1,
      required_software: ['CODESYS'],
      instructions: 'Build a start/stop circuit in simulation.',
      submission_requirements: 'Upload ST source and screenshots.',
      safety_notes: 'Take regular screen breaks during long simulation sessions.',
      alternative_software: ['OpenPLC'],
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.brief.version, 1)
    assert.match(parsed.brief.delivery_notes, /No physical PLC/)
    assert.match(parsed.brief.safety_notes, /screen breaks/)
    assert.deepEqual(parsed.brief.alternative_software, ['OpenPLC'])
    assert.notEqual(parsed.brief.safety_notes, parsed.brief.delivery_notes)
  })

  it('round-trips a complete brief without dropping fields', () => {
    const complete = {
      version: 1 as const,
      learning_objectives: ['Implement start/stop in simulation'],
      prerequisites: 'Lesson 2 completed',
      required_software: ['CODESYS'],
      optional_software: ['Factory I/O'],
      alternative_software: ['OpenPLC'],
      instructions: '1. Open project\n2. Build logic\n3. Simulate',
      expected_results: 'Motor runs when Start is pressed',
      simulation_requirements: 'Force Start/Stop and verify interlock',
      submission_requirements: 'ZIP + PDF screenshots',
      documentation_requirements: 'Short technical explanation',
      safety_notes: 'Ergonomic breaks; no live electrical work',
      delivery_notes: 'Virtual software only for this assessment.',
    }
    const parsed = parsePracticalBrief(complete)
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.deepEqual(parsed.brief, complete)

    const republished = parsePracticalBrief(parsed.brief)
    assert.equal(republished.ok, true)
    if (!republished.ok) return
    assert.deepEqual(republished.brief, complete)
  })

  it('requires rubric and software before publish but only warns on missing outcomes', () => {
    const brief = {
      ...emptyPracticalBrief(),
      required_software: ['Factory I/O'],
      instructions: 'Simulate the fault scenario.',
      submission_requirements: 'ZIP project + PDF report',
    }
    const rubric = {
      title: 'Rubric',
      criteria: [
        {
          title: 'Simulation',
          description: 'Faults diagnosed',
          max_points: 10,
          sort_order: 0,
          levels: [
            { label: 'Not met', description: '', points: 0, sort_order: 0 },
            { label: 'Met', description: '', points: 10, sort_order: 1 },
          ],
        },
      ],
    }
    assert.equal(validateRubricForPublish(rubric).ok, true)

    const blocked = canPublishPractical({
      title: 'Motor starter sim',
      kind: 'laboratory',
      brief: emptyPracticalBrief(),
      rubric,
      outcomeLinkCount: 0,
    })
    assert.equal(blocked.ok, false)

    const warned = canPublishPractical({
      title: 'Motor starter sim',
      kind: 'laboratory',
      brief,
      rubric,
      outcomeLinkCount: 0,
    })
    assert.equal(warned.ok, true)
    assert.ok(warned.warnings.some((w) => /learning outcomes/i.test(w)))
  })

  it('rejects rubric levels that exceed criterion max_points', () => {
    const bad = validateRubricForPublish({
      title: 'Rubric',
      criteria: [
        {
          title: 'Logic',
          description: '',
          max_points: 10,
          sort_order: 0,
          levels: [{ label: 'Over', description: '', points: 11, sort_order: 0 }],
        },
      ],
    })
    assert.equal(bad.ok, false)
  })

  it('keeps quiz delivery mode not_applicable and practicals virtual_software by default', () => {
    assert.equal(defaultDeliveryModeForKind('quiz'), 'not_applicable')
    assert.equal(defaultDeliveryModeForKind('project'), 'virtual_software')
  })
})

describe('lifecycle transitions', () => {
  it('allows draft→submitted and returned→resubmitted for students only', () => {
    assert.equal(assertPracticalTransition({ from: 'draft', to: 'submitted', actor: 'student' }).ok, true)
    assert.equal(assertPracticalTransition({ from: 'returned', to: 'resubmitted', actor: 'student' }).ok, true)
    assert.equal(assertPracticalTransition({ from: 'submitted', to: 'graded', actor: 'student' }).ok, false)
    assert.equal(assertPracticalTransition({ from: 'draft', to: 'resubmitted', actor: 'student' }).ok, false)
  })

  it('allows lecturer marking transitions including re-grade paths', () => {
    assert.equal(assertPracticalTransition({ from: 'submitted', to: 'graded', actor: 'lecturer' }).ok, true)
    assert.equal(assertPracticalTransition({ from: 'resubmitted', to: 'returned', actor: 'lecturer' }).ok, true)
    assert.equal(assertPracticalTransition({ from: 'draft', to: 'graded', actor: 'lecturer' }).ok, false)
  })

  it('locks students out of submitted/resubmitted/graded while allowing returned revision', () => {
    assert.equal(studentMayEditPractical('draft'), true)
    assert.equal(studentMayEditPractical('returned'), true)
    assert.equal(studentMayEditPractical('submitted'), false)
    assert.equal(studentMayEditPractical('resubmitted'), false)
    assert.equal(studentMayEditPractical('graded'), false)
    assert.equal(nextStatusAfterStudentSubmit('draft'), 'submitted')
    assert.equal(nextStatusAfterStudentSubmit('returned'), 'resubmitted')
    assert.equal(CLEARED_PRACTICAL_GRADE_FIELDS.score, null)
    assert.equal(CLEARED_PRACTICAL_GRADE_FIELDS.feedback_summary, null)
    assert.equal(CLEARED_PRACTICAL_GRADE_FIELDS.passed, false)
  })

  it('service fails closed on resubmit RPC errors and never uses a multi-write fallback', () => {
    const service = readSrc('lib/learning/practical-assessment-service.ts')
    assert.match(service, /resubmit_practical_submission/)
    assert.match(service, /mark_practical_submission/)
    assert.match(service, /mapPracticalRpcFailure/)
    assert.match(service, /Fail closed/)
    assert.match(service, /practical_status: status === 'returned' \? 'returned' : 'draft'/)
    assert.match(service, /\.eq\('practical_status', status\)/)
    assert.match(service, /assertPracticalTransition/)
    // No silent clear-then-update fallback after RPC failure.
    assert.doesNotMatch(
      service,
      /missingFn[\s\S]*assessment_criterion_scores[\s\S]*delete[\s\S]*CLEARED_PRACTICAL_GRADE_FIELDS/
    )
    assert.doesNotMatch(
      service,
      /rpcError[\s\S]*from\('assessment_criterion_scores'\)[\s\S]*delete[\s\S]*practical_status: nextStatus/
    )
  })
})

describe('scoring', () => {
  it('normalizes criterion points to a percent and applies passing_score', () => {
    const scored = computePracticalScore({
      criteria: [
        { id: 'c1', max_points: 40, levels: [{ id: 'l1' }] },
        { id: 'c2', max_points: 60, levels: [{ id: 'l2' }] },
      ],
      criterionScores: [
        { criterionId: 'c1', pointsAwarded: 40, levelId: 'l1' },
        { criterionId: 'c2', pointsAwarded: 30, levelId: 'l2' },
      ],
    })
    assert.equal(scored.ok, true)
    if (!scored.ok) return
    assert.equal(scored.percent, 70)
    assert.equal(passFromPercent(scored.percent, 70), true)
    assert.equal(passFromPercent(69, 70), false)

    const over = computePracticalScore({
      criteria: [{ id: 'c1', max_points: 10, levels: [] }],
      criterionScores: [{ criterionId: 'c1', pointsAwarded: 11 }],
    })
    assert.equal(over.ok, false)
  })

  it('rejects cross-criterion level ids and missing criterion scores', () => {
    const cross = computePracticalScore({
      criteria: [
        { id: 'c1', max_points: 10, levels: [{ id: 'l1' }] },
        { id: 'c2', max_points: 10, levels: [{ id: 'l2' }] },
      ],
      criterionScores: [
        { criterionId: 'c1', pointsAwarded: 10, levelId: 'l2' },
        { criterionId: 'c2', pointsAwarded: 10, levelId: 'l2' },
      ],
    })
    assert.equal(cross.ok, false)

    const missing = computePracticalScore({
      criteria: [
        { id: 'c1', max_points: 10, levels: [] },
        { id: 'c2', max_points: 10, levels: [] },
      ],
      criterionScores: [{ criterionId: 'c1', pointsAwarded: 10 }],
    })
    assert.equal(missing.ok, false)
  })
})

describe('upload and storage policy', () => {
  it('allows approved engineering extensions and rejects others', () => {
    assert.ok(PRACTICAL_ALLOWED_EXTENSIONS.includes('zip'))
    assert.ok(PRACTICAL_ALLOWED_EXTENSIONS.includes('st'))
    assert.equal(
      validatePracticalUploadFile({ name: 'logic.st', type: 'text/plain', size: 1200 }).ok,
      true
    )
    assert.equal(
      validatePracticalUploadFile({ name: 'project.zip', type: 'application/zip', size: 1200 }).ok,
      true
    )
    assert.equal(
      validatePracticalUploadFile({ name: 'virus.exe', type: 'application/octet-stream', size: 1200 })
        .ok,
      false
    )
    assert.equal(
      validatePracticalUploadFile({
        name: 'huge.zip',
        type: 'application/zip',
        size: 26 * 1024 * 1024,
      }).ok,
      false
    )
  })

  it('rejects executables renamed as pdf/zip using content signatures', () => {
    const pe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00])
    assert.equal(
      validatePracticalUploadFile({
        name: 'malware.pdf',
        type: 'application/pdf',
        size: pe.length,
        bytes: pe,
      }).ok,
      false
    )
    assert.equal(
      validatePracticalUploadFile({
        name: 'malware.zip',
        type: 'application/zip',
        size: pe.length,
        bytes: pe,
      }).ok,
      false
    )

    const pdf = Buffer.from('%PDF-1.4 sample')
    assert.equal(
      validatePracticalUploadFile({
        name: 'report.pdf',
        type: 'application/pdf',
        size: pdf.length,
        bytes: pdf,
      }).ok,
      true
    )

    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00])
    assert.equal(
      validatePracticalUploadFile({
        name: 'project.zip',
        type: 'application/zip',
        size: zip.length,
        bytes: zip,
      }).ok,
      true
    )
  })

  it('authorizes server-minted storage keys only under the expected prefix', () => {
    const expected = {
      courseId: 'course-1',
      assessmentId: 'assess-1',
      userId: 'user-1',
    }
    assert.equal(
      isAuthorizedPracticalStorageKey(
        'assessment-submissions/course-1/assess-1/user-1/123-abc.pdf',
        expected
      ),
      true
    )
    assert.equal(
      isAuthorizedPracticalStorageKey(
        'assessment-submissions/course-1/assess-1/other-user/123.pdf',
        expected
      ),
      false
    )
    assert.equal(
      isAuthorizedPracticalStorageKey('https://cdn.example/assessment-submissions/x.pdf', expected),
      false
    )
    assert.equal(
      isAuthorizedPracticalStorageKey(
        'assessment-submissions/course-1/assess-1/user-1/../secret.pdf',
        expected
      ),
      false
    )
  })

  it('rejects empty files, path-like names, and MIME/extension mismatches', () => {
    assert.equal(validatePracticalUploadFile({ name: 'a.pdf', type: 'application/pdf', size: 0 }).ok, false)
    assert.equal(
      validatePracticalUploadFile({ name: '../escape.pdf', type: 'application/pdf', size: 10 }).ok,
      false
    )
    assert.equal(
      validatePracticalUploadFile({ name: 'dir/report.pdf', type: 'application/pdf', size: 10 }).ok,
      false
    )
    assert.equal(
      validatePracticalUploadFile({
        name: 'notes.txt',
        type: 'application/pdf',
        size: 12,
        bytes: Buffer.from('hello world!'),
      }).ok,
      false
    )
    // Declared image/jpeg for .png is a MIME mismatch.
    assert.equal(
      validatePracticalUploadFile({
        name: 'shot.png',
        type: 'image/jpeg',
        size: 8,
        bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      }).ok,
      false
    )
  })
})

describe('workflow behavior (in-memory)', () => {
  it('models draft→submitted→returned→resubmitted→graded with edit locks', () => {
    let status: 'draft' | 'submitted' | 'returned' | 'resubmitted' | 'graded' = 'draft'
    assert.equal(studentMayEditPractical(status), true)
    assert.equal(assertPracticalTransition({ from: status, to: 'submitted', actor: 'student' }).ok, true)
    status = 'submitted'
    assert.equal(studentMayEditPractical(status), false)

    assert.equal(assertPracticalTransition({ from: status, to: 'returned', actor: 'lecturer' }).ok, true)
    status = 'returned'
    assert.equal(studentMayEditPractical(status), true)

    assert.equal(assertPracticalTransition({ from: status, to: 'resubmitted', actor: 'student' }).ok, true)
    status = 'resubmitted'
    assert.equal(studentMayEditPractical(status), false)
    assert.equal(CLEARED_PRACTICAL_GRADE_FIELDS.score, null)

    assert.equal(assertPracticalTransition({ from: status, to: 'graded', actor: 'lecturer' }).ok, true)
    status = 'graded'
    assert.equal(studentMayEditPractical(status), false)

    // Stale student write after resubmit/grade is rejected by transition rules.
    assert.equal(assertPracticalTransition({ from: 'resubmitted', to: 'submitted', actor: 'student' }).ok, false)
    assert.equal(assertPracticalTransition({ from: 'graded', to: 'resubmitted', actor: 'student' }).ok, false)
  })

  it('computes pass/fail from server-normalized percent and configured passing score', () => {
    const scored = computePracticalScore({
      criteria: [
        { id: 'c1', max_points: 25, levels: [{ id: 'l1' }] },
        { id: 'c2', max_points: 25, levels: [{ id: 'l2' }] },
        { id: 'c3', max_points: 50, levels: [{ id: 'l3' }] },
      ],
      criterionScores: [
        { criterionId: 'c1', pointsAwarded: 20, levelId: 'l1' },
        { criterionId: 'c2', pointsAwarded: 25, levelId: 'l2' },
        { criterionId: 'c3', pointsAwarded: 40, levelId: 'l3' },
      ],
    })
    assert.equal(scored.ok, true)
    if (!scored.ok) return
    assert.equal(scored.totalAwarded, 85)
    assert.equal(scored.totalPossible, 100)
    assert.equal(scored.percent, 85)
    assert.equal(passFromPercent(scored.percent, 80), true)
    assert.equal(passFromPercent(scored.percent, 90), false)
  })
})

describe('wiring contracts', () => {
  it('keeps quiz eligibility path free of practical certificate coupling', () => {
    const quiz = readSrc('lib/learning/quiz.ts')
    assert.match(quiz, /queryCourseQuizStandings/)
    assert.match(quiz, /eligible/)
    assert.doesNotMatch(quiz, /practical_status/)
    assert.match(quiz, /assessment_kind/)
  })

  it('GET student practical does not create drafts; PATCH creates drafts intentionally', () => {
    const getRoute = readSrc('app/api/student/practicals/[id]/route.ts')
    const patchRoute = readSrc('app/api/student/practicals/[id]/submission/route.ts')
    const listRoute = readSrc('app/api/student/assessments/route.ts')
    assert.match(getRoute, /getStudentPracticalSubmission/)
    assert.doesNotMatch(getRoute, /getOrCreateStudentPracticalSubmission|ensureStudentPracticalDraft/)
    assert.match(getRoute, /submission: submission/)
    assert.match(patchRoute, /ensureStudentPracticalDraft/)
    assert.match(listRoute, /getStudentPracticalSubmission/)
  })

  it('student UI renders full brief fields and uses storage_key artifacts', () => {
    const panel = readSrc('components/student/course-practical-panel.tsx')
    assert.match(panel, /learning_objectives/)
    assert.match(panel, /prerequisites/)
    assert.match(panel, /optional_software/)
    assert.match(panel, /alternative_software/)
    assert.match(panel, /expected_results/)
    assert.match(panel, /simulation_requirements/)
    assert.match(panel, /documentation_requirements/)
    assert.match(panel, /safety_notes/)
    assert.match(panel, /delivery_notes/)
    assert.match(panel, /storage_key/)
    assert.match(panel, /status === 'draft' \|\| status === 'returned'/)
  })

  it('wires private artifact download routes for student, lecturer, and admin', () => {
    const studentArtifact = readSrc(
      'app/api/student/practicals/[id]/artifacts/[artifactId]/route.ts'
    )
    const lecturerArtifact = readSrc(
      'app/api/lecturer/courses/[id]/practicals/artifacts/[artifactId]/route.ts'
    )
    const adminArtifact = readSrc(
      'app/api/admin/courses/[id]/practicals/artifacts/[artifactId]/route.ts'
    )
    const upload = readSrc('app/api/student/practicals/[id]/upload/route.ts')
    const getRoute = readSrc('app/api/student/practicals/[id]/route.ts')
    assert.match(studentArtifact, /getPracticalArtifactSignedUrl/)
    assert.match(studentArtifact, /ownerUserId/)
    assert.match(lecturerArtifact, /getPracticalArtifactSignedUrl/)
    assert.match(lecturerArtifact, /requireLecturerCourseAccess/)
    assert.match(adminArtifact, /requireAdminPermission/)
    assert.match(adminArtifact, /getPracticalArtifactSignedUrl/)
    assert.match(upload, /bytes: buffer/)
    assert.match(upload, /storageKey/)
    assert.doesNotMatch(upload, /url: result\.url/)
    assert.match(getRoute, /editable && a\.storage_key/)
  })

  it('lecturer submission list omits storage_key and uses authorized download_path', () => {
    const route = readSrc('app/api/lecturer/courses/[id]/practicals/submissions/route.ts')
    const panel = readSrc('components/lecturer/lecturer-practical-marking-panel.tsx')
    assert.match(route, /requireLecturerCourseAccess/)
    assert.match(route, /download_path/)
    assert.match(route, /practicals\/artifacts\/\$\{artifact\.id\}/)
    assert.doesNotMatch(route, /storage_key:\s*artifact\.storage_key/)
    assert.doesNotMatch(route, /file_url:\s*artifact\.file_url/)
    assert.match(panel, /download_path|practicals\/artifacts\/\$\{file\.id\}/)
    assert.doesNotMatch(panel, /storage_key\?:/)
  })

  it('wires lecturer and student practical surfaces and secondary UX', () => {
    const workspace = readSrc('components/lecturer/lecturer-course-workspace.tsx')
    const student = readSrc('app/student/courses/[courseId]/page.tsx')
    const builder = readSrc('components/lecturer/lecturer-practical-builder.tsx')
    const labs = readSrc('components/student/course-lab-panel.tsx')
    const plans = readSrc('lib/learning/learning-plan-template.ts')
    const gradebook = readSrc('components/lecturer/lecturer-gradebook-panel.tsx')
    const service = readSrc('lib/learning/practical-assessment-service.ts')
    assert.match(workspace, /LecturerPracticalBuilder/)
    assert.match(workspace, /LecturerPracticalMarkingPanel/)
    assert.match(student, /CoursePracticalPanel/)
    assert.match(builder, /safety_notes/)
    assert.match(builder, /alternative_software/)
    assert.match(labs, /historical/)
    assert.match(labs, /Practical assessments/)
    assert.match(plans, /assessment_kind/)
    assert.match(plans, /assessmentKind/)
    assert.match(gradebook, /Certificate eligibility remains quiz-based/)
    assert.match(service, /Cannot replace the marking rubric after students have submitted/)
    assert.match(service, /assessmentHasLockedPracticalWork/)
  })
})
