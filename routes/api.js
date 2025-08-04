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
        // Get projects first (using admin client to bypass RLS for now)
        const { data: projects, error: projectsError } = await supabaseAdmin
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        // For each project, get the members separately
        const projectsWithMembers = await Promise.all(
            (projects || []).map(async (project) => {
                                       const { data: members } = await supabaseAdmin
                    .from('project_members')
                    .select(`
                        user_id,
                        role,
                        users!inner(name, email, role)
                    `)
                    .eq('project_id', project.id);

                return {
                    ...project,
                    project_members: members || []
                };
            })
        );

        res.json(projectsWithMembers);
    } catch (error) {
        console.error('Projects API error:', error);
        res.status(500).json({ error: 'Failed to load projects' });
    }
});

// Get single project by ID
route.get('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get project
        const { data: project, error: projectError } = await supabaseAdmin
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (projectError) throw projectError;

        // Get project members
        const { data: members } = await supabaseAdmin
            .from('project_members')
            .select(`
                user_id,
                role,
                users!inner(name, email, role)
            `)
            .eq('project_id', id);

        const projectWithMembers = {
            ...project,
            project_members: members || []
        };

        res.json(projectWithMembers);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to load project' });
    }
});

// Create new project
route.post('/projects', async (req, res) => {
    try {
        const { name, description, team_members = [] } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        // For now, we'll use the first user in the database as created_by
        // In a real app, this would be req.session.user.id
        const { data: users } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (!users || users.length === 0) {
            return res.status(400).json({ error: 'No users found. Please create a user first.' });
        }

        const created_by = users[0].id;

        // Create project in database (using admin client to bypass RLS)
        const { data: project, error: projectError } = await supabaseAdmin
            .from('projects')
            .insert({
                name,
                description,
                status: 'active',
                created_by
            })
            .select()
            .single();

        if (projectError) throw projectError;

        // Add team members to project_members table
        if (team_members.length > 0) {
            const memberInserts = team_members.map(userId => ({
                project_id: project.id,
                user_id: userId,
                role: 'member'
            }));

            const { error: membersError } = await supabaseAdmin
                .from('project_members')
                .insert(memberInserts);

            if (membersError) {
                console.error('Error adding team members:', membersError);
                // Don't fail the whole request if team member addition fails
            }
        }

        res.json({ success: true, project });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project', details: error.message });
    }
});

// Update project
route.put('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type, priority, status, team_members = [] } = req.body;

        // Update project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .update({
                name,
                description,
                type,
                priority,
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (projectError) throw projectError;

        // Update team members - remove existing and add new ones
        await supabase
            .from('project_members')
            .delete()
            .eq('project_id', id);

        if (team_members.length > 0) {
            const memberInserts = team_members.map(userId => ({
                project_id: id,
                user_id: userId,
                role: 'member'
            }));

            const { error: membersError } = await supabase
                .from('project_members')
                .insert(memberInserts);

            if (membersError) {
                console.error('Error updating team members:', membersError);
            }
        }

        res.json({ success: true, project });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
route.delete('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete project (team members will be deleted automatically due to CASCADE)
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Tasks API
route.get('/tasks', async (req, res) => {
    try {
        const { data: tasks, error } = await supabaseAdmin
            .from('tasks')
            .select(`
                *,
                projects!inner(name),
                users!inner(name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(tasks || []);
    } catch (error) {
        console.error('Tasks API error:', error);
        res.status(500).json({ error: 'Failed to load tasks' });
    }
});

route.post('/tasks', async (req, res) => {
    try {
        const { title, description, project_id, assigned_to, priority, due_date } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Task title is required' });
        }

        // Get first user as created_by for now
        const { data: users } = await supabaseAdmin
            .from('users')
            .select('id')
            .limit(1);

        if (!users || users.length === 0) {
            return res.status(400).json({ error: 'No users found' });
        }

        const created_by = users[0].id;

        const { data: task, error } = await supabaseAdmin
            .from('tasks')
            .insert({
                title,
                description,
                project_id,
                assigned_to,
                priority: priority || 'Medium',
                status: 'Pending',
                due_date,
                created_by,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, task });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

route.put('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, project_id, assigned_to, priority, status, due_date } = req.body;

        const { data: task, error } = await supabaseAdmin
            .from('tasks')
            .update({
                title,
                description,
                project_id,
                assigned_to,
                priority,
                status,
                due_date,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, task });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

route.delete('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
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