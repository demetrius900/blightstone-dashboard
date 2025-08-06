const express = require('express');
const router = express.Router();
const authService = require('../utils/auth');

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        // Verify session is still valid
        const result = await authService.getCurrentUser(req.session.accessToken);
        if (!result.success) {
            req.session.destroy();
            return res.status(401).json({ success: false, error: 'Session expired' });
        }

        req.user = result.user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ success: false, error: 'Authentication error' });
    }
};

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and password are required' 
            });
        }

        const result = await authService.login({ email, password });

        if (result.success) {
            console.log('🔐 Login successful, setting session for user:', result.user.email);
            
            // Store user session in express session
            req.session.user = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.profile.name,
                role: result.user.profile.role
            };
            
            // Also store tokens for API calls
            req.session.accessToken = result.session.access_token;
            req.session.refreshToken = result.session.refresh_token;
            
            console.log('✅ Session set with user:', req.session.user.email);
            console.log('🔍 Session ID:', req.session.id);
            
            res.json({
                success: true,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.profile.name,
                    role: result.user.profile.role
                },
                message: 'Login successful'
            });
        } else {
            console.log('❌ Login failed:', result.error);
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// Direct registration (for internal use)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role = 'Team Member' } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email, password, and name are required' 
            });
        }

        // Create user directly
        const result = await authService.createUser({
            email,
            password,
            name,
            role
        });

        if (result.success) {
            res.json({
                success: true,
                message: 'Account created successfully. Please log in.'
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

// Register (complete invitation) - keeping for backward compatibility
router.post('/register-invitation', async (req, res) => {
    try {
        const { token, password, name } = req.body;

        if (!token || !password || !name) {
            return res.status(400).json({ 
                success: false, 
                error: 'Token, password, and name are required' 
            });
        }

        const result = await authService.completeInvitation({ token, password, name });

        if (result.success) {
            res.json({
                success: true,
                message: 'Account created successfully! You can now log in.',
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.name,
                    role: result.user.role
                }
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

// Invite team member
router.post('/invite', requireAuth, async (req, res) => {
    try {
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and role are required' 
            });
        }

        const result = await authService.inviteTeamMember({
            email,
            role,
            inviterName: req.user.profile.name,
            inviterId: req.user.id
        });

        res.json(result);
    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ success: false, error: 'Invitation failed' });
    }
});

// Verify invitation
router.get('/verify-invitation/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const result = await authService.verifyInvitation(token);

        if (result.success) {
            res.json({
                success: true,
                invitation: {
                    email: result.invitation.email,
                    role: result.invitation.role,
                    expires_at: result.invitation.expires_at
                }
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Verify invitation error:', error);
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.profile.name,
            role: req.user.profile.role,
            avatar_url: req.user.profile.avatar_url
        }
    });
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        await authService.logout();
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, error: 'Logout failed' });
    }
});

module.exports = { router, requireAuth };