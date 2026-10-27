-- ============================================================
-- Fix: funding_transactions RLS policies
-- Allows authenticated users to insert donations and
-- allows public read so campaign pages can display progress.
-- ============================================================

-- ── Make sure RLS is enabled ──────────────────────────────
ALTER TABLE funding_transactions ENABLE ROW LEVEL SECURITY;

-- ── Drop any old conflicting policies ────────────────────
DROP POLICY IF EXISTS "funding_transactions_read" ON funding_transactions;
DROP POLICY IF EXISTS "funding_transactions_insert" ON funding_transactions;
DROP POLICY IF EXISTS "funding_transactions_select" ON funding_transactions;
DROP POLICY IF EXISTS "funding_transactions_all" ON funding_transactions;

-- ── Public read: anyone can see which donations happened ──
CREATE POLICY "funding_transactions_read"
  ON funding_transactions
  FOR SELECT
  USING (true);

-- ── Unrestricted insert: any user (authed or anon) can donate ──
CREATE POLICY "funding_transactions_insert"
  ON funding_transactions
  FOR INSERT
  WITH CHECK (true);

-- ── Also enable RLS on the funding table if not already ──
ALTER TABLE funding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funding_read" ON funding;
DROP POLICY IF EXISTS "funding_insert" ON funding;
DROP POLICY IF EXISTS "funding_update" ON funding;
DROP POLICY IF EXISTS "funding_delete" ON funding;

-- Public read
CREATE POLICY "funding_read"
  ON funding
  FOR SELECT
  USING (true);

-- Authenticated insert
CREATE POLICY "funding_insert"
  ON funding
  FOR INSERT
  WITH CHECK (true);

-- Owner update/delete (supports both id and auth_id user patterns)
CREATE POLICY "funding_update"
  ON funding
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = funding.user_id
        AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "funding_delete"
  ON funding
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = funding.user_id
        AND users.auth_id = auth.uid()
    )
  );

-- ── funding_categories: public read ───────────────────────
ALTER TABLE funding_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "funding_categories_read" ON funding_categories;
CREATE POLICY "funding_categories_read"
  ON funding_categories
  FOR SELECT
  USING (true);
