-- The web app writes ledger rows with these types/statuses, but they were
-- never enum values, so every such insert failed silently (and deposit
-- idempotency, which looks for an earlier 'deposit' row, never matched).
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'deposit';

ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'transfer_debit';

ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'transfer_credit';

ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'campaign_donation';

ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'campaign_payout';

ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'reversed';
