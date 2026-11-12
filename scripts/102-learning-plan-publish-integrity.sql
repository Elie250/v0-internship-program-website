-- Phase 1 corrections: snapshot titles, revision uniqueness, transactional publish/clone,
-- and published/archived immutability. Additive / idempotent.
-- Run after scripts/101-curriculum-workload-and-learning-plans.sql.
-- Application-layer authorization is still required: supabaseAdmin bypasses RLS.

-- ---------------------------------------------------------------------------
-- Snapshot title (historical display independent of live curriculum titles)
-- ---------------------------------------------------------------------------

ALTER TABLE course_learning_plan_items
  ADD COLUMN IF NOT EXISTS snapshot_title TEXT;

COMMENT ON COLUMN course_learning_plan_items.snapshot_title IS
  'Frozen activity display title at publish time. Historical plans must not read live lesson/assessment titles.';

-- ---------------------------------------------------------------------------
-- Revision uniqueness (draft uses revision 0; published/archived use 1+)
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS course_learning_plan_templates_course_revision_uidx
  ON course_learning_plan_templates (course_id, revision);

-- ---------------------------------------------------------------------------
-- Immutability helpers (bypass only inside trusted publish/clone transactions)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION learning_plan_writes_allowed()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.learning_plan_write', true), '') = '1';
$$;

CREATE OR REPLACE FUNCTION prevent_learning_plan_template_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF learning_plan_writes_allowed() THEN
    RETURN NEW;
  END IF;
  IF OLD.status IN ('published', 'archived') THEN
    RAISE EXCEPTION 'Published and archived learning plans cannot be modified in place.';
  END IF;
  IF NEW.status IN ('published', 'archived') AND OLD.status = 'draft' THEN
    RAISE EXCEPTION 'Publish learning plans through publish_course_learning_plan only.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_learning_plan_templates_immutable_update ON course_learning_plan_templates;
CREATE TRIGGER course_learning_plan_templates_immutable_update
  BEFORE UPDATE ON course_learning_plan_templates
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_learning_plan_template_update();

CREATE OR REPLACE FUNCTION prevent_learning_plan_day_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_status TEXT;
  v_template_id UUID;
BEGIN
  IF learning_plan_writes_allowed() THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  v_template_id := COALESCE(NEW.template_id, OLD.template_id);
  SELECT status INTO v_status
  FROM course_learning_plan_templates
  WHERE id = v_template_id;

  IF NOT FOUND THEN
    -- Parent already removed (course/template CASCADE).
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF v_status IN ('published', 'archived') THEN
    RAISE EXCEPTION 'Days on published or archived learning plans cannot be modified.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_learning_plan_days_immutable ON course_learning_plan_days;
CREATE TRIGGER course_learning_plan_days_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON course_learning_plan_days
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_learning_plan_day_mutation();

CREATE OR REPLACE FUNCTION prevent_learning_plan_item_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_status TEXT;
  v_day_id UUID;
BEGIN
  IF learning_plan_writes_allowed() THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  v_day_id := COALESCE(NEW.day_id, OLD.day_id);
  SELECT t.status INTO v_status
  FROM course_learning_plan_days d
  JOIN course_learning_plan_templates t ON t.id = d.template_id
  WHERE d.id = v_day_id;

  IF NOT FOUND THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF v_status IN ('published', 'archived') THEN
    RAISE EXCEPTION 'Items on published or archived learning plans cannot be modified.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_learning_plan_items_immutable ON course_learning_plan_items;
CREATE TRIGGER course_learning_plan_items_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON course_learning_plan_items
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_learning_plan_item_mutation();

-- Draft day/item inserts must remain allowed without the bypass flag.
-- The INSERT triggers above would block draft inserts if parent is draft — they only block published/archived.
-- Good.

-- ---------------------------------------------------------------------------
-- Transactional publish (allocates revision under row locks; all-or-nothing)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION publish_course_learning_plan(
  p_course_id UUID,
  p_draft_id UUID,
  p_updated_by UUID,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft course_learning_plan_templates%ROWTYPE;
  v_next_revision INT;
  v_published_id UUID;
  v_day JSONB;
  v_item JSONB;
  v_day_id UUID;
  v_title TEXT;
  v_notes TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload -> 'days') <> 'array' THEN
    RAISE EXCEPTION 'Publish payload must include a days array.';
  END IF;
  IF jsonb_array_length(p_payload -> 'days') < 1 THEN
    RAISE EXCEPTION 'Add at least one learning day before publishing.';
  END IF;

  PERFORM set_config('app.learning_plan_write', '1', true);

  -- Serialize publishers for this course (includes draft row).
  PERFORM 1
  FROM course_learning_plan_templates
  WHERE course_id = p_course_id
  FOR UPDATE;

  SELECT * INTO v_draft
  FROM course_learning_plan_templates
  WHERE id = p_draft_id
    AND course_id = p_course_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Learning plan not found.';
  END IF;
  IF v_draft.status <> 'draft' THEN
    RAISE EXCEPTION 'Only a draft learning plan can be published.';
  END IF;

  SELECT COALESCE(MAX(revision), 0) + 1
  INTO v_next_revision
  FROM course_learning_plan_templates
  WHERE course_id = p_course_id;

  v_title := NULLIF(BTRIM(COALESCE(p_payload ->> 'title', v_draft.title)), '');
  IF v_title IS NULL THEN
    v_title := 'Daily learning plan';
  END IF;
  v_notes := NULLIF(BTRIM(COALESCE(p_payload ->> 'notes', COALESCE(v_draft.notes, ''))), '');

  INSERT INTO course_learning_plan_templates (
    course_id,
    title,
    status,
    revision,
    notes,
    updated_at,
    updated_by,
    published_at
  )
  VALUES (
    p_course_id,
    v_title,
    'published',
    v_next_revision,
    v_notes,
    v_now,
    p_updated_by,
    v_now
  )
  RETURNING id INTO v_published_id;

  FOR v_day IN
    SELECT value FROM jsonb_array_elements(p_payload -> 'days')
  LOOP
    INSERT INTO course_learning_plan_days (
      template_id,
      day_index,
      title,
      sort_order
    )
    VALUES (
      v_published_id,
      (v_day ->> 'day_index')::INT,
      NULLIF(BTRIM(COALESCE(v_day ->> 'title', '')), ''),
      COALESCE((v_day ->> 'sort_order')::INT, (v_day ->> 'day_index')::INT)
    )
    RETURNING id INTO v_day_id;

    IF v_day -> 'items' IS NULL OR jsonb_typeof(v_day -> 'items') <> 'array' THEN
      CONTINUE;
    END IF;

    FOR v_item IN
      SELECT value FROM jsonb_array_elements(v_day -> 'items')
    LOOP
      IF NULLIF(BTRIM(COALESCE(v_item ->> 'snapshot_title', '')), '') IS NULL THEN
        RAISE EXCEPTION 'Each published activity requires a snapshot_title.';
      END IF;
      IF NULLIF(BTRIM(COALESCE(v_item ->> 'snapshot_activity_kind', '')), '') IS NULL THEN
        RAISE EXCEPTION 'Each published activity requires a snapshot_activity_kind.';
      END IF;
      IF (v_item ->> 'snapshot_minutes') IS NULL OR (v_item ->> 'snapshot_minutes')::INT <= 0 THEN
        RAISE EXCEPTION 'Each published activity requires positive snapshot_minutes.';
      END IF;

      INSERT INTO course_learning_plan_items (
        day_id,
        activity_type,
        activity_id,
        sort_order,
        is_optional,
        portion_minutes,
        span_group_id,
        snapshot_minutes,
        snapshot_activity_kind,
        snapshot_title
      )
      VALUES (
        v_day_id,
        v_item ->> 'activity_type',
        (v_item ->> 'activity_id')::UUID,
        COALESCE((v_item ->> 'sort_order')::INT, 0),
        COALESCE((v_item ->> 'is_optional')::BOOLEAN, false),
        CASE
          WHEN v_item ->> 'portion_minutes' IS NULL OR v_item ->> 'portion_minutes' = '' THEN NULL
          ELSE (v_item ->> 'portion_minutes')::INT
        END,
        CASE
          WHEN v_item ->> 'span_group_id' IS NULL OR v_item ->> 'span_group_id' = '' THEN NULL
          ELSE (v_item ->> 'span_group_id')::UUID
        END,
        (v_item ->> 'snapshot_minutes')::INT,
        v_item ->> 'snapshot_activity_kind',
        BTRIM(v_item ->> 'snapshot_title')
      );
    END LOOP;
  END LOOP;

  UPDATE course_learning_plan_templates
  SET updated_at = v_now,
      updated_by = p_updated_by
  WHERE id = p_draft_id;

  RETURN v_published_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Clone published/archived revision into the single course draft
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION clone_published_learning_plan_to_draft(
  p_course_id UUID,
  p_source_id UUID,
  p_updated_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source course_learning_plan_templates%ROWTYPE;
  v_draft_id UUID;
  v_existing_draft_id UUID;
  v_src_day RECORD;
  v_new_day_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  PERFORM set_config('app.learning_plan_write', '1', true);

  PERFORM 1
  FROM course_learning_plan_templates
  WHERE course_id = p_course_id
  FOR UPDATE;

  SELECT * INTO v_source
  FROM course_learning_plan_templates
  WHERE id = p_source_id
    AND course_id = p_course_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Published learning plan not found.';
  END IF;
  IF v_source.status NOT IN ('published', 'archived') THEN
    RAISE EXCEPTION 'Only a published or archived revision can be cloned into a draft.';
  END IF;

  SELECT id INTO v_existing_draft_id
  FROM course_learning_plan_templates
  WHERE course_id = p_course_id
    AND status = 'draft'
  FOR UPDATE;

  IF v_existing_draft_id IS NOT NULL THEN
    DELETE FROM course_learning_plan_templates WHERE id = v_existing_draft_id;
  END IF;

  INSERT INTO course_learning_plan_templates (
    course_id,
    title,
    status,
    revision,
    notes,
    updated_at,
    updated_by,
    published_at
  )
  VALUES (
    p_course_id,
    v_source.title,
    'draft',
    0,
    v_source.notes,
    v_now,
    p_updated_by,
    NULL
  )
  RETURNING id INTO v_draft_id;

  FOR v_src_day IN
    SELECT id, day_index, title, sort_order
    FROM course_learning_plan_days
    WHERE template_id = p_source_id
    ORDER BY day_index ASC, sort_order ASC
  LOOP
    INSERT INTO course_learning_plan_days (
      template_id,
      day_index,
      title,
      sort_order
    )
    VALUES (
      v_draft_id,
      v_src_day.day_index,
      v_src_day.title,
      v_src_day.sort_order
    )
    RETURNING id INTO v_new_day_id;

    INSERT INTO course_learning_plan_items (
      day_id,
      activity_type,
      activity_id,
      sort_order,
      is_optional,
      portion_minutes,
      span_group_id,
      snapshot_minutes,
      snapshot_activity_kind,
      snapshot_title
    )
    SELECT
      v_new_day_id,
      i.activity_type,
      i.activity_id,
      i.sort_order,
      i.is_optional,
      i.portion_minutes,
      i.span_group_id,
      NULL,
      NULL,
      NULL
    FROM course_learning_plan_items i
    WHERE i.day_id = v_src_day.id
    ORDER BY i.sort_order ASC;
  END LOOP;

  RETURN v_draft_id;
END;
$$;

REVOKE ALL ON FUNCTION publish_course_learning_plan(UUID, UUID, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION clone_published_learning_plan_to_draft(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION publish_course_learning_plan(UUID, UUID, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION clone_published_learning_plan_to_draft(UUID, UUID, UUID) TO service_role;

COMMENT ON FUNCTION publish_course_learning_plan(UUID, UUID, UUID, JSONB) IS
  'Atomically publishes a draft learning plan as a new revision with frozen activity snapshots.';
COMMENT ON FUNCTION clone_published_learning_plan_to_draft(UUID, UUID, UUID) IS
  'Replaces the course draft with a clone of a published/archived revision (structure only; snapshots cleared).';

NOTIFY pgrst, 'reload schema';
