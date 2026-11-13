-- ==============================================================================
-- NovoStream Option D: In-Stream Live Shopping & Pinned Storefront Products
-- 1. Updates live_streams with pinned_product_id and pinned_product_data
-- 2. Creates live_stream_sales table for in-stream product orders
-- ==============================================================================

-- 1. Add pinned product columns to live_streams
ALTER TABLE public.live_streams
    ADD COLUMN IF NOT EXISTS pinned_product_id UUID,
    ADD COLUMN IF NOT EXISTS pinned_product_data JSONB;

CREATE INDEX IF NOT EXISTS idx_live_streams_pinned_product_id ON public.live_streams(pinned_product_id);

-- 2. Create live_stream_sales table for completed in-stream purchases
CREATE TABLE IF NOT EXISTS public.live_stream_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
    product_id UUID,
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_title TEXT NOT NULL,
    product_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('wallet', 'paystack')),
    payment_reference TEXT UNIQUE,
    delivery_option TEXT NOT NULL DEFAULT 'pickup',
    delivery_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_stream_sales_stream_id ON public.live_stream_sales(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_sales_creator_id ON public.live_stream_sales(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_sales_buyer_id ON public.live_stream_sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_sales_created_at ON public.live_stream_sales(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.live_stream_sales ENABLE ROW LEVEL SECURITY;

-- Policy: Buyers can view their own stream purchases
CREATE POLICY "Buyers can view their own stream purchases"
    ON public.live_stream_sales
    FOR SELECT
    USING (auth.uid() = buyer_id);

-- Policy: Creators can view orders for their products
CREATE POLICY "Creators can view their stream sales"
    ON public.live_stream_sales
    FOR SELECT
    USING (auth.uid() = creator_id);

-- Policy: Service role full access
CREATE POLICY "Service role full access on live_stream_sales"
    ON public.live_stream_sales
    FOR ALL
    USING (auth.role() = 'service_role');
