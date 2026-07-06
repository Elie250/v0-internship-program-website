-- IremboPay online payments (alongside manual MoMo Pay Code + receipt flow)
-- Run in Supabase SQL Editor after scripts/07-manual-payment-verification.sql

ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_provider TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'RWF';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_payments_gateway_reference ON payments (gateway_reference);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_transaction_id ON payments (gateway_transaction_id);
