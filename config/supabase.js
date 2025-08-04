const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: 'config.local.env' }); // Load local config first
dotenv.config(); // Then load .env (if exists)

// Use environment variables or fallback to remote
const supabaseUrl = process.env.SUPABASE_URL || 'https://vddtsunsahhccmtamdcg.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZHRzdW5zYWhoY2NtdGFtZGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTA5NTAsImV4cCI6MjA2OTc4Njk1MH0.c06yTFuQSD33RhbpEmtL9EpUAlUzA7QWN0BFJtFHh3o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log(`🚀 Connected to Supabase: ${supabaseUrl}`);

module.exports = supabase; 