-- ==============================================================================
-- NovoStream Option C: Paid Mini-Classes & Ticketed Live Workshops
-- 1. Updates live_streams with ticketing and scheduling metadata
-- 2. Creates live_stream_tickets table for verified ticket purchases
-- ==============================================================================

-- 1. Add ticketing columns to live_streams
ALTER TABLE public.live_streams
    ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS ticket_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    ADD COLUMN IF NOT EXISTS workshop_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_live_streams_is_paid ON public.live_streams(is_paid);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_for ON public.live_streams(scheduled_for);

-- 2. Create live_stream_tickets table
CREATE TABLE IF NOT EXISTS public.live_stream_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    price_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('wallet', 'paystack')),
    payment_reference TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT live_stream_tickets_stream_buyer_unique UNIQUE(live_stream_id, buyer_id)
);

-- Indexes for lightning fast access checks
CREATE INDEX IF NOT EXISTS idx_live_stream_tickets_buyer_stream ON public.live_stream_tickets(buyer_id, live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_tickets_creator_id ON public.live_stream_tickets(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_tickets_created_at ON public.live_stream_tickets(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.live_stream_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Buyers can view their own tickets
CREATE POLICY "Buyers can view their own stream tickets"
    ON public.live_stream_tickets
    FOR SELECT
    USING (auth.uid() = buyer_id);

-- Policy: Creators can view tickets for their streams
CREATE POLICY "Creators can view tickets sold for their streams"
    ON public.live_stream_tickets
    FOR SELECT
    USING (auth.uid() = creator_id);

-- Policy: Service role full access
CREATE POLICY "Service role full access on live_stream_tickets"
    ON public.live_stream_tickets
    FOR ALL
    USING (auth.role() = 'service_role');
