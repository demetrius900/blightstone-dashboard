-- Fix user creation by adding INSERT policy for users table
-- This allows new users to be created during registration

-- Add policy to allow user creation during registration
CREATE POLICY "Allow user creation during registration" ON public.users
    FOR INSERT WITH CHECK (true);

-- Alternative approach: Allow authenticated users to create their own profile
-- (This is safer but requires the auth.uid() to match the id being inserted)
DROP POLICY IF EXISTS "Allow user creation during registration" ON public.users;

CREATE POLICY "Users can create their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);