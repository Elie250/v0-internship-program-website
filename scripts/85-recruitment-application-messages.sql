-- Employer-authored emails to candidates (instructions, document requests, links).
-- Run in Supabase SQL Editor after scripts/84-recruitment-assessment-instructions.sql.
-- Does NOT modify Academy tables.

CREATE TABLE IF NOT EXISTS recruitment_application_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruitment_organizations(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'general'
    CHECK (message_type IN ('general', 'request_documents', 'instructions')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  resource_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  channel TEXT NOT NULL DEFAULT 'email',
  delivery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'failed', 'skipped')),
  delivery_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recruitment_app_messages_app_idx
  ON recruitment_application_messages (application_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_app_messages_org_idx
  ON recruitment_application_messages (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recruitment_app_messages_recipient_idx
  ON recruitment_application_messages (recipient_user_id, created_at DESC);

ALTER TABLE recruitment_application_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_recruitment_app_messages" ON recruitment_application_messages;
CREATE POLICY "deny_public_recruitment_app_messages" ON recruitment_application_messages
  FOR ALL USING (false);

COMMENT ON TABLE recruitment_application_messages IS
  'Employer emails sent to a candidate about one application. Distinct from internal HR notes.';
