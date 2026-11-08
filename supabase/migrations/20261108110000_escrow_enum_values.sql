-- Ledger types for artisan-job escrow. Kept in their own migration: a new enum
-- value can't be used in the same transaction that adds it.
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'escrow_hold';      -- customer wallet → escrow
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'escrow_release';   -- escrow → artisan wallet (after fee)
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'escrow_refund';    -- escrow → customer wallet

-- notifications.type may be an enum or plain text depending on the project's
-- history; add 'artisan_job' only if it is an enum.
DO $$
DECLARE v_type regtype;
BEGIN
  SELECT a.atttypid::regtype INTO v_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'notifications' AND a.attname = 'type';

  IF v_type IS NOT NULL AND EXISTS (SELECT 1 FROM pg_type WHERE oid = v_type AND typtype = 'e') THEN
    EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', v_type, 'artisan_job');
  END IF;
END $$;
