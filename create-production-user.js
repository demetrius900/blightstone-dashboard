const { createClient } = require('@supabase/supabase-js');

// Production Supabase configuration
const supabaseUrl = 'https://vddtsunsahhccmtamdcg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY_PROD; // You'll need to set this

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
    try {
        console.log('Creating test user in production...');
        
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: 'test@example.com',
            password: 'test123',
            email_confirm: true, // Auto-confirm
            user_metadata: {
                name: 'Test User',
                role: 'Admin'
            }
        });

        if (authError) {
            console.error('Auth creation failed:', authError);
            return;
        }

        console.log('✅ Auth user created:', authData.user.id);

        // Create user profile in database
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                email: 'test@example.com',
                name: 'Test User',
                role: 'Admin',
                status: 'active',
                invited_by: null
            })
            .select()
            .single();

        if (profileError) {
            console.error('Profile creation failed:', profileError);
            // Clean up auth user
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return;
        }

        console.log('✅ User profile created:', profileData);
        console.log('✅ Test user ready! Email: test@example.com, Password: test123');

    } catch (error) {
        console.error('Error creating test user:', error);
    }
}

createTestUser();