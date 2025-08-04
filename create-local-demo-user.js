require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

// Use local Supabase for demo user creation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createLocalDemoUser() {
    console.log('🚀 Creating local demo user for Blightstone...\n');

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
    } catch (error) {
        console.error('❌ Error creating demo user:', error.message);
        process.exit(1);
    }
}

async function createUserProfile(user) {
    try {
        // Create user profile in database
        const { data, error } = await supabase
            .from('users')
            .upsert({
                id: user.id,
                email: user.email,
                name: 'Admin User',
                role: 'Administrator',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.log('⚠️ Profile creation error:', error.message);
        } else {
            console.log('✅ User profile created/updated');
        }
    } catch (error) {
        console.log('⚠️ Profile error:', error.message);
    }
}

// Run the function
createLocalDemoUser();