-- Engineer community + plan tier features (free vs paid)
-- Run after scripts/17-engineering-support-subscriptions.sql

ALTER TABLE support_subscription_plans ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE support_subscription_plans ADD COLUMN IF NOT EXISTS max_ai_messages INT DEFAULT 0;
ALTER TABLE support_subscription_plans ADD COLUMN IF NOT EXISTS community_can_post BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE support_subscription_plans ADD COLUMN IF NOT EXISTS community_can_reply BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE support_subscriptions ADD COLUMN IF NOT EXISTS ai_messages_used INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS engineer_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  topic TEXT DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  reply_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engineer_discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES engineer_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS engineer_discussions_created_idx ON engineer_discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS engineer_discussion_replies_discussion_idx ON engineer_discussion_replies(discussion_id);

CREATE TABLE IF NOT EXISTS support_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES support_subscriptions(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_ai_messages_user_idx ON support_ai_messages(user_id, created_at DESC);

-- Free community plan (instant activation, no payment)
INSERT INTO support_subscription_plans (
  name, slug, description, price, duration_days, max_tickets, response_sla_hours,
  plan_tier, max_ai_messages, community_can_post, community_can_reply,
  features, sort_order, status
)
VALUES (
  'Community Free',
  'community-free',
  'Join the engineer community — browse discussions and get limited AI guidance.',
  0,
  365,
  0,
  NULL,
  'free',
  5,
  false,
  true,
  '["Browse engineer discussions", "Reply in community threads", "5 AI assistant messages per year", "Upgrade to post topics & open support tickets"]'::jsonb,
  0,
  'published'
)
ON CONFLICT (slug) DO UPDATE SET
  plan_tier = EXCLUDED.plan_tier,
  max_ai_messages = EXCLUDED.max_ai_messages,
  community_can_post = EXCLUDED.community_can_post,
  community_can_reply = EXCLUDED.community_can_reply,
  features = EXCLUDED.features,
  price = EXCLUDED.price;

-- Upgrade paid plans with community + AI features
UPDATE support_subscription_plans SET
  plan_tier = 'paid',
  max_ai_messages = 30,
  community_can_post = true,
  community_can_reply = true
WHERE slug = 'starter-support';

UPDATE support_subscription_plans SET
  plan_tier = 'paid',
  max_ai_messages = 100,
  community_can_post = true,
  community_can_reply = true
WHERE slug = 'professional-support';

UPDATE support_subscription_plans SET
  plan_tier = 'paid',
  max_ai_messages = NULL,
  community_can_post = true,
  community_can_reply = true
WHERE slug = 'enterprise-support';

NOTIFY pgrst, 'reload schema';
