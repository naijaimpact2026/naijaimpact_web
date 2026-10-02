-- Add status column to funding table for creator closure and completion tracking
ALTER TABLE funding 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_funding_status ON funding(status);
