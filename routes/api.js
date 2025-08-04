const express = require('express');
const route = express.Router();
const { supabase, supabaseAdmin } = require('../utils/supabase');

// Dashboard API
route.get('/dashboard', async (req, res) => {
    try {
        // Get projects, tasks, and team members for dashboard
        const [projectsResponse, tasksResponse, usersResponse] = await Promise.all([
            supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(5),
            supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(8),
            supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        const dashboardData = {
            projects: projectsResponse.data || [],
            tasks: tasksResponse.data || [],
            teamMembers: usersResponse.data || []
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Dashboard API error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Projects API
route.get('/projects', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                project_members(user_id, users(name, email, role))
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Projects API error:', error);
        res.status(500).json({ error: 'Failed to load projects' });
    }
});

// Users API
route.get('/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Users API error:', error);
        res.status(500).json({ error: 'Failed to load users' });
    }
});

// Get user by email
route.get('/users/:email', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', req.params.email)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('User API error:', error);
        res.status(404).json({ error: 'User not found' });
    }
});

// Delete user
route.delete('/users/:email', async (req, res) => {
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('email', req.params.email);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Delete user API error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Project-specific APIs
// Creative Tracker
route.get('/projects/:projectId/creatives', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('creative_tracker')
            .select('*')
            .eq('project_id', req.params.projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Creatives API error:', error);
        res.status(500).json({ error: 'Failed to load creatives' });
    }
});

route.post('/projects/:projectId/creatives', async (req, res) => {
    try {
        const creativeData = {
            ...req.body,
            project_id: req.params.projectId
        };

        const { data, error } = await supabase
            .from('creative_tracker')
            .insert([creativeData])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Create creative API error:', error);
        res.status(500).json({ error: 'Failed to create creative' });
    }
});

// Customer Avatars
route.get('/projects/:projectId/avatars', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('customer_avatars')
            .select('*')
            .eq('project_id', req.params.projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Avatars API error:', error);
        res.status(500).json({ error: 'Failed to load avatars' });
    }
});

route.post('/projects/:projectId/avatars', async (req, res) => {
    try {
        const avatarData = {
            ...req.body,
            project_id: req.params.projectId
        };

        const { data, error } = await supabase
            .from('customer_avatars')
            .insert([avatarData])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Create avatar API error:', error);
        res.status(500).json({ error: 'Failed to create avatar' });
    }
});

// Competitor Analysis
route.get('/projects/:projectId/competitors', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitor_analysis')
            .select('*')
            .eq('project_id', req.params.projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Competitors API error:', error);
        res.status(500).json({ error: 'Failed to load competitors' });
    }
});

route.post('/projects/:projectId/competitors', async (req, res) => {
    try {
        const competitorData = {
            ...req.body,
            project_id: req.params.projectId
        };

        const { data, error } = await supabase
            .from('competitor_analysis')
            .insert([competitorData])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Create competitor API error:', error);
        res.status(500).json({ error: 'Failed to create competitor' });
    }
});

module.exports = route; 