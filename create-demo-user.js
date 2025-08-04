const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabaseUrl = 'https://vddtsunsahhccmtamdcg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZHRzdW5zYWhoY2NtdGFtZGNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIxMDk1MCwiZXhwIjoyMDY5Nzg2OTUwfQ.vsGed684_OfCgI4pDxslJ0QooVVA_L0on_-rhzWuoDc';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoUser() {
    console.log('🚀 Creating demo user for Blightstone...\n');

    try {
        // Create demo user
        const { data, error } = await supabase.auth.admin.createUser({
            email: 'admin@blightstone.com',
            password: 'password123',
            user_metadata: {
                name: 'Admin User',
                role: 'Administrator'
            },
            email_confirm: true
        });

        if (error) {
            if (error.message.includes('already registered')) {
                console.log('✅ Demo user already exists: admin@blightstone.com');
                
                // Get existing user
                const { data: existingUser } = await supabase.auth.admin.listUsers();
                const demoUser = existingUser.users.find(u => u.email === 'admin@blightstone.com');
                
                if (demoUser) {
                    await createUserProfile(demoUser);
                }
            } else {
                throw error;
            }
        } else {
            console.log('✅ Demo user created successfully!');
            console.log('📧 Email: admin@blightstone.com');
            console.log('🔐 Password: password123');
            
            // Create user profile
            await createUserProfile(data.user);
        }

        console.log('\n🎉 Demo user setup completed!');
        console.log('You can now login with:');
        console.log('Email: admin@blightstone.com');
        console.log('Password: password123');

    } catch (error) {
        console.error('❌ Error creating demo user:', error.message);
    }
}

async function createUserProfile(user) {
    try {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (existingProfile) {
            console.log('✅ User profile already exists');
            return;
        }

        // Create user profile
        const { data, error } = await supabase
            .from('users')
            .insert([{
                id: user.id,
                name: user.user_metadata?.name || 'Admin User',
                email: user.email,
                role: user.user_metadata?.role || 'Administrator',
                status: 'Active'
            }])
            .select()
            .single();

        if (error) {
            console.log('⚠️  Profile creation error (this might be normal):', error.message);
        } else {
            console.log('✅ User profile created successfully');
        }
    } catch (error) {
        console.log('⚠️  Profile error (this might be normal):', error.message);
    }
}

// Run the setup
createDemoUser();