-- Paid access for Energy Library books & culture (admin / lecturer uploads)

ALTER TABLE energy_library_items
  ADD COLUMN IF NOT EXISTS price_rwf INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS library_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_item_id UUID NOT NULL REFERENCES energy_library_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id UUID,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'active', 'rejected', 'refunded')),
  amount_due INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (library_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_library_purchases_user ON library_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_library_purchases_item ON library_purchases(library_item_id);
CREATE INDEX IF NOT EXISTS idx_library_purchases_status ON library_purchases(status);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS library_purchase_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_library_purchase_id_fkey'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_library_purchase_id_fkey
      FOREIGN KEY (library_purchase_id) REFERENCES library_purchases(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'library_purchases_payment_id_fkey'
  ) THEN
    ALTER TABLE library_purchases
      ADD CONSTRAINT library_purchases_payment_id_fkey
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;
  END IF;
END $$;
