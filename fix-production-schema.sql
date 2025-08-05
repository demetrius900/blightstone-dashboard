-- Fix production database schema
-- Add missing invited_by column to users table

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.users(id);

-- Update RLS policies if needed
-- (The existing policies should still work)

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;