const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: './.env' });

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Supabase configuration - prioritize PROD variables for production, fallback to local
const supabaseUrl = isProduction 
    ? (process.env.SUPABASE_URL_PROD || process.env.SUPABASE_URL)
    : (process.env.SUPABASE_URL || process.env.SUPABASE_URL_PROD);

const supabaseAnonKey = isProduction 
    ? (process.env.SUPABASE_ANON_KEY_PROD || process.env.SUPABASE_ANON_KEY)
    : (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY_PROD);

const supabaseServiceKey = isProduction 
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY_PROD || process.env.SUPABASE_SERVICE_ROLE_KEY)
    : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY_PROD);

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
    supabase,
    supabaseAdmin
};