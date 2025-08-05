-- Disable email confirmations for easier development
-- This allows users to sign in immediately without email verification

-- Update auth configuration to disable email confirmations
UPDATE auth.config 
SET enable_confirmations = false 
WHERE key = 'enable_confirmations';

-- Also update any existing unconfirmed users to be confirmed
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- Verify the changes
SELECT email, email_confirmed_at, confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;