-- ============================================================
-- Migration: 20261002113000_create_funding_payouts.sql
-- Description: Table for tracking crowdfunding campaign disbursements
-- to Hubnovo Platform Wallet or external Nigerian Bank Accounts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.funding_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_id UUID NOT NULL REFERENCES public.funding(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  destination VARCHAR(20) NOT NULL CHECK (destination IN ('wallet', 'bank')),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference VARCHAR(100) NOT NULL UNIQUE,
  bank_name VARCHAR(100),
  account_number VARCHAR(20),
  account_name VARCHAR(150),
  bank_code VARCHAR(20),
  paystack_transfer_code VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_funding_payouts_funding_id ON public.funding_payouts(funding_id);
CREATE INDEX IF NOT EXISTS idx_funding_payouts_user_id ON public.funding_payouts(user_id);

-- Enable RLS
ALTER TABLE public.funding_payouts ENABLE ROW LEVEL SECURITY;

-- Allow campaign creators to read their own payouts
CREATE POLICY "Creators can view their campaign payouts"
  ON public.funding_payouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow system/creators to insert payouts
CREATE POLICY "Creators can insert campaign payouts"
  ON public.funding_payouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
