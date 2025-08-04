const { supabase, supabaseAdmin } = require('./supabase');
const emailService = require('./email');
const crypto = require('crypto');

class AuthService {
    constructor() {
        this.sessionStore = new Map(); // In production, use Redis or database
    }

    // Generate secure tokens
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Create user account
    async createUser({ email, password, name, role = 'team_member', invitedBy = null }) {
        try {
            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true, // Auto-confirm for invited users
                user_metadata: {
                    name,
                    role,
                    invited_by: invitedBy
                }
            });

            if (authError) {
                throw new Error(`Auth creation failed: ${authError.message}`);
            }

            // Create user profile in database
            const { data: profileData, error: profileError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email,
                    name,
                    role,
                    status: 'active',
                    invited_by: invitedBy,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (profileError) {
                // Clean up auth user if profile creation fails
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                throw new Error(`Profile creation failed: ${profileError.message}`);
            }

            return {
                success: true,
                user: {
                    id: authData.user.id,
                    email,
                    name,
                    role,
                    ...profileData
                }
            };
        } catch (error) {
            console.error('Create user error:', error);
            return { success: false, error: error.message };
        }
    }

    // Send team invitation
    async inviteTeamMember({ email, role, inviterName, inviterId }) {
        try {
            // Check if user already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id, email')
                .eq('email', email)
                .single();

            if (existingUser) {
                return { success: false, error: 'User already exists in the system' };
            }

            // Create invitation record
            const inviteToken = this.generateToken();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            const { data: inviteData, error: inviteError } = await supabase
                .from('invitations')
                .insert({
                    email,
                    role,
                    invited_by: inviterId,
                    invite_token: inviteToken,
                    expires_at: expiresAt.toISOString(),
                    status: 'pending'
                })
                .select()
                .single();

            if (inviteError) {
                throw new Error(`Invitation creation failed: ${inviteError.message}`);
            }

            // Send invitation email
            await emailService.sendTeamInvite({
                email,
                inviterName,
                organizationName: 'Blightstone',
                inviteToken
            });

            return {
                success: true,
                invitation: inviteData
            };
        } catch (error) {
            console.error('Invite team member error:', error);
            return { success: false, error: error.message };
        }
    }

    // Verify invitation token
    async verifyInvitation(token) {
        try {
            const { data: invitation, error } = await supabase
                .from('invitations')
                .select('*')
                .eq('invite_token', token)
                .eq('status', 'pending')
                .gt('expires_at', new Date().toISOString())
                .single();

            if (error || !invitation) {
                return { success: false, error: 'Invalid or expired invitation' };
            }

            return { success: true, invitation };
        } catch (error) {
            return { success: false, error: 'Invalid invitation' };
        }
    }

    // Complete invitation (user registers)
    async completeInvitation({ token, password, name }) {
        try {
            // Verify invitation
            const inviteResult = await this.verifyInvitation(token);
            if (!inviteResult.success) {
                return inviteResult;
            }

            const invitation = inviteResult.invitation;

            // Create user account
            const userResult = await this.createUser({
                email: invitation.email,
                password,
                name,
                role: invitation.role,
                invitedBy: invitation.invited_by
            });

            if (!userResult.success) {
                return userResult;
            }

            // Mark invitation as completed
            await supabase
                .from('invitations')
                .update({ 
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', invitation.id);

            return {
                success: true,
                user: userResult.user
            };
        } catch (error) {
            console.error('Complete invitation error:', error);
            return { success: false, error: error.message };
        }
    }

    // User login
    async login({ email, password }) {
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                return { success: false, error: 'Invalid email or password' };
            }

            // Get user profile
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (profileError) {
                return { success: false, error: 'User profile not found' };
            }

            return {
                success: true,
                user: {
                    ...authData.user,
                    profile
                },
                session: authData.session
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // User logout
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get current user from session
    async getCurrentUser(sessionToken) {
        try {
            const { data: { user }, error } = await supabase.auth.getUser(sessionToken);
            
            if (error || !user) {
                return { success: false, error: 'Invalid session' };
            }

            // Get user profile
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                return { success: false, error: 'User profile not found' };
            }

            return {
                success: true,
                user: {
                    ...user,
                    profile
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new AuthService();