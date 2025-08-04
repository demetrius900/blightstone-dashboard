const { createClient } = require('@supabase/supabase-js');

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Supabase configuration
const supabaseUrl = isProduction 
    ? process.env.SUPABASE_URL_PROD 
    : process.env.SUPABASE_URL;

const supabaseAnonKey = isProduction 
    ? process.env.SUPABASE_ANON_KEY_PROD 
    : process.env.SUPABASE_ANON_KEY;

const supabaseServiceKey = isProduction 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY_PROD 
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
    supabase,
    supabaseAdmin
};