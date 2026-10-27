-- ==============================================================================
-- NovoStream Day-One Creator Earnings & Monetization Schema
-- Tables: creator_stream_transactions, creator_payout_requests
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.creator_stream_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    live_stream_id UUID REFERENCES public.live_streams(id) ON DELETE SET NULL,
    payer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    payer_name TEXT,
    title TEXT NOT NULL,
    route_key TEXT NOT NULL CHECK (route_key IN ('tips', 'tickets', 'marketplace', 'affiliates', 'sponsorships', 'payout')),
    type TEXT NOT NULL CHECK (type IN ('tip', 'ticket', 'marketplace_sale', 'affiliate_commission', 'sponsorship', 'withdrawal')),
    gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    platform_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'settled' CHECK (status IN ('settled', 'pending', 'completed', 'refunded')),
    channel_or_stream TEXT,
    reference TEXT UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performant filtering and balance aggregations
CREATE INDEX IF NOT EXISTS idx_creator_stream_tx_creator_id ON public.creator_stream_transactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_stream_tx_route_key ON public.creator_stream_transactions(route_key);
CREATE INDEX IF NOT EXISTS idx_creator_stream_tx_status ON public.creator_stream_transactions(status);
CREATE INDEX IF NOT EXISTS idx_creator_stream_tx_created_at ON public.creator_stream_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_stream_tx_live_stream_id ON public.creator_stream_transactions(live_stream_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.creator_stream_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can view their own transactions
CREATE POLICY "Creators can view their own stream transactions"
    ON public.creator_stream_transactions
    FOR SELECT
    USING (auth.uid() = creator_id);

-- Policy: Service role has full access
CREATE POLICY "Service role full access on creator_stream_transactions"
    ON public.creator_stream_transactions
    FOR ALL
    USING (auth.role() = 'service_role');
