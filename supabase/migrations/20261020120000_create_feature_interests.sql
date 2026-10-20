-- Create feature_interests table for tracking user interest in upcoming platform features
CREATE TABLE IF NOT EXISTS public.feature_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    module VARCHAR(50) NOT NULL DEFAULT 'saving_wallet',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    use_case VARCHAR(50),
    monthly_volume VARCHAR(50),
    notes TEXT,
    contact_email VARCHAR(255),
    notify_opt_in BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_interests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert feature interest responses
CREATE POLICY "Authenticated users can submit feature interest"
    ON public.feature_interests FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own submissions
CREATE POLICY "Users can view their own feature interests"
    ON public.feature_interests FOR SELECT
    USING (auth.uid() = user_id);
