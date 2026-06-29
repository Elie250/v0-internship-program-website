-- Shop orders: customer contact, fulfillment type, and admin workflow
-- Run after scripts/02-create-academy-tables.sql and scripts/04-engineering-hub-platform.sql

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'pickup';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;

    UPDATE orders SET status = 'pending' WHERE status IS NULL OR status = 'Pending';
    UPDATE orders SET fulfillment_type = 'delivery'
      WHERE fulfillment_type IS NULL AND delivery_address IS NOT NULL AND delivery_address <> '';
    UPDATE orders SET fulfillment_type = 'pickup' WHERE fulfillment_type IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total NUMERIC(10, 2);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
    UPDATE products SET low_stock_threshold = 5 WHERE low_stock_threshold IS NULL;
    UPDATE products SET in_stock = (COALESCE(stock, 0) > 0)
      WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'in_stock'
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

-- Orders are created and managed only through server APIs (service role).
-- No public RLS policies are added here.
