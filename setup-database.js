const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabaseUrl = 'https://vddtsunsahhccmtamdcg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZHRzdW5zYWhoY2NtdGFtZGNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIxMDk1MCwiZXhwIjoyMDY5Nzg2OTUwfQ.vsGed684_OfCgI4pDxslJ0QooVVA_L0on_-rhzWuoDc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
    console.log('🚀 Setting up Blightstone database...\n');

    try {
        // Test connection
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1);
        
        if (error) {
            console.log('⚠️  Connection test failed (this is normal):', error.message);
        } else {
            console.log('✅ Supabase connection successful');
        }

        console.log('\n📋 Database setup instructions:');
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
        console.log('2. Select your project: vddtsunsahhccmtamdcg');
        console.log('3. Go to SQL Editor in the left sidebar');
        console.log('4. Copy and paste the contents of supabase-setup.sql');
        console.log('5. Click "Run" to execute the SQL commands');
        console.log('\nThis will create:');
        console.log('✅ users table (for team members)');
        console.log('✅ projects table (for project management)');
        console.log('✅ tasks table (for task management)');
        console.log('✅ Row Level Security policies');
        console.log('✅ Sample data for testing');

        console.log('\n🎯 After running the SQL:');
        console.log('1. Test the API endpoints at http://localhost:8000/api/tasks');
        console.log('2. Configure authentication in Supabase dashboard');
        console.log('3. Set up file storage for avatars');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Please run the SQL commands manually in your Supabase SQL Editor');
    }
}

// Run the setup
setupDatabase(); 