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
        console.log('🗑️ DELETE API called for project:', id);

        // Delete project (team members will be deleted automatically due to CASCADE)
        // Use supabaseAdmin to bypass RLS for deletion
        const { data, error } = await supabaseAdmin
            .from('projects')
            .delete()
            .eq('id', id)
            .select(); // Add select to see what was deleted

        console.log('🗑️ Delete result - data:', data);
        console.log('🗑️ Delete result - error:', error);

        if (error) {
            console.error('❌ Delete error:', error);
            throw error;
        }

        // Even if no rows were affected, consider it success (idempotent)
        console.log('✅ Project deletion completed - rows affected:', data?.length || 0);
        res.json({ success: true, deletedRows: data?.length || 0 });
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
                projects(name),
                users!tasks_assigned_to_fkey(name, email),
                created_by_user:users!tasks_created_by_fkey(name, email)
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

        // Clean up empty UUID fields and dates
        const taskData = {
            title,
            description,
            priority: priority || 'Medium',
            status: 'Pending',
            created_by,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Only add project_id and assigned_to if they have values
        if (project_id && project_id.trim() !== '') {
            taskData.project_id = project_id;
        }
        if (assigned_to && assigned_to.trim() !== '') {
            taskData.assigned_to = assigned_to;
        }
        // Only add due_date if it has a value
        if (due_date && due_date.trim() !== '') {
            taskData.due_date = due_date;
        }

        const { data: task, error } = await supabaseAdmin
            .from('tasks')
            .insert(taskData)
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

// Project-specific Tasks API
route.get('/projects/:projectId/tasks', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { data: tasks, error } = await supabaseAdmin
            .from('tasks')
            .select(`
                *,
                projects(name),
                users!tasks_assigned_to_fkey(name, email),
                created_by_user:users!tasks_created_by_fkey(name, email)
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(tasks || []);
    } catch (error) {
        console.error('Project tasks API error:', error);
        res.status(500).json({ error: 'Failed to load project tasks' });
    }
});

// Creative Tracker API
route.get('/projects/:projectId/creatives', async (req, res) => {
    try {
        const { projectId } = req.params;
        console.log('🔍 Loading creatives for project:', projectId);
        
        const { data: creatives, error } = await supabaseAdmin
            .from('creative_entries')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        
        console.log('✅ Creatives loaded:', creatives?.length || 0);
        res.json(creatives || []);
    } catch (error) {
        console.error('Creative entries API error:', error);
        res.status(500).json({ error: 'Failed to load creative entries' });
    }
});

route.post('/projects/:projectId/creatives', async (req, res) => {
    try {
        const { projectId } = req.params;
        const creativeData = req.body;

        // Get first user as created_by for now
        const { data: users } = await supabaseAdmin
            .from('users')
            .select('id')
            .limit(1);

        if (!users || users.length === 0) {
            return res.status(400).json({ error: 'No users found' });
        }

        // Only include fields that exist in the database schema
        const allowedFields = [
            'batch_number', 'brand', 'status', 'launch_date', 'ad_concept', 
            'ad_type', 'ad_variable', 'desire', 'benefit_focus', 'objections', 
            'persona', 'positioning_concept', 'positioning_how', 'hook_pattern', 
            'results', 'winning_ads', 'brief_link'
        ];
        
        const filteredData = {};
        allowedFields.forEach(field => {
            if (creativeData[field] !== undefined && creativeData[field] !== '') {
                filteredData[field] = creativeData[field];
            }
        });

        const { data: creative, error } = await supabaseAdmin
            .from('creative_entries')
            .insert({
                ...filteredData,
                project_id: projectId,
                created_by: users[0].id
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, creative });
    } catch (error) {
        console.error('Create creative entry error:', error);
        res.status(500).json({ error: 'Failed to create creative entry' });
    }
});

// PUT - Update creative
route.put('/projects/:projectId/creatives/:id', async (req, res) => {
    try {
        const { projectId, id } = req.params;
        const creativeData = req.body;
        
        // Only include fields that exist in the database schema
        const allowedFields = [
            'batch_number', 'brand', 'status', 'launch_date', 'ad_concept', 
            'ad_type', 'ad_variable', 'desire', 'benefit_focus', 'objections', 
            'persona', 'positioning_concept', 'positioning_how', 'hook_pattern', 
            'results', 'winning_ads', 'brief_link'
        ];
        
        const filteredData = {};
        allowedFields.forEach(field => {
            if (creativeData[field] !== undefined && creativeData[field] !== '') {
                filteredData[field] = creativeData[field];
            }
        });

        const { data: creative, error } = await supabaseAdmin
            .from('creative_entries')
            .update(filteredData)
            .eq('id', id)
            .eq('project_id', projectId)
            .select()
            .single();

        if (error) {
            console.error('Error updating creative:', error);
            return res.status(500).json({ error: 'Failed to update creative' });
        }

        res.json(creative);
    } catch (error) {
        console.error('Error updating creative:', error);
        res.status(500).json({ error: 'Failed to update creative' });
    }
});

// DELETE - Delete creative
route.delete('/projects/:projectId/creatives/:id', async (req, res) => {
    try {
        const { projectId, id } = req.params;

        const { error } = await supabaseAdmin
            .from('creative_entries')
            .delete()
            .eq('id', id)
            .eq('project_id', projectId);

        if (error) {
            console.error('Error deleting creative:', error);
            return res.status(500).json({ error: 'Failed to delete creative' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting creative:', error);
        res.status(500).json({ error: 'Failed to delete creative' });
    }
});

// Customer Avatars API
route.get('/projects/:projectId/avatars', async (req, res) => {
    try {
        const { projectId } = req.params;
        console.log('🔍 Loading avatars for project:', projectId);
        
        const { data: avatars, error } = await supabaseAdmin
            .from('customer_avatars')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        
        console.log('✅ Avatars loaded:', avatars?.length || 0);
        res.json(avatars || []);
    } catch (error) {
        console.error('Customer avatars API error:', error);
        res.status(500).json({ error: 'Failed to load customer avatars' });
    }
});

route.post('/projects/:projectId/avatars', async (req, res) => {
    try {
        const { projectId } = req.params;
        const avatarData = req.body;

        // Get first user as created_by for now
        const { data: users } = await supabaseAdmin
            .from('users')
            .select('id')
            .limit(1);

        if (!users || users.length === 0) {
            return res.status(400).json({ error: 'No users found' });
        }

        // Only include fields that exist in the database schema
        const allowedFields = [
            'name', 'age_group', 'gender', 'location', 'occupation', 
            'income_level', 'family_status', 'pain_points', 'goals', 'key_messaging'
        ];
        
        const filteredData = {};
        allowedFields.forEach(field => {
            if (avatarData[field] !== undefined && avatarData[field] !== '') {
                filteredData[field] = avatarData[field];
            }
        });

        const { data: avatar, error } = await supabaseAdmin
            .from('customer_avatars')
            .insert({
                ...filteredData,
                project_id: projectId,
                created_by: users[0].id
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, avatar });
    } catch (error) {
        console.error('Create customer avatar error:', error);
        res.status(500).json({ error: 'Failed to create customer avatar' });
    }
});

// PUT - Update avatar
route.put('/projects/:projectId/avatars/:id', async (req, res) => {
    try {
        const { projectId, id } = req.params;
        const avatarData = req.body;
        
        // Only include fields that exist in the database schema
        const allowedFields = [
            'name', 'age_group', 'gender', 'location', 'occupation', 'income_level',
            'family_status', 'pain_points', 'goals', 'key_messaging'
        ];
        
        const filteredData = {};
        allowedFields.forEach(field => {
            if (avatarData[field] !== undefined && avatarData[field] !== '') {
                filteredData[field] = avatarData[field];
            }
        });

        const { data: avatar, error } = await supabaseAdmin
            .from('customer_avatars')
            .update(filteredData)
            .eq('id', id)
            .eq('project_id', projectId)
            .select()
            .single();

        if (error) {
            console.error('Error updating avatar:', error);
            return res.status(500).json({ error: 'Failed to update avatar' });
        }

        res.json(avatar);
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

// DELETE - Delete avatar
route.delete('/projects/:projectId/avatars/:id', async (req, res) => {
    try {
        const { projectId, id } = req.params;

        const { error } = await supabaseAdmin
            .from('customer_avatars')
            .delete()
            .eq('id', id)
            .eq('project_id', projectId);

        if (error) {
            console.error('Error deleting avatar:', error);
            return res.status(500).json({ error: 'Failed to delete avatar' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting avatar:', error);
        res.status(500).json({ error: 'Failed to delete avatar' });
    }
});

// Competitor Analysis API
route.get('/projects/:projectId/competitors', async (req, res) => {
    try {
        const { projectId } = req.params;
        console.log('🔍 Loading competitors for project:', projectId);
        
        const { data: competitors, error } = await supabaseAdmin
            .from('competitor_analysis')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        
        console.log('✅ Competitors loaded:', competitors?.length || 0);
        res.json(competitors || []);
    } catch (error) {
        console.error('Competitor analysis API error:', error);
        res.status(500).json({ error: 'Failed to load competitor analysis' });
    }
});

route.post('/projects/:projectId/competitors', async (req, res) => {
    try {
        const { projectId } = req.params;
        const competitorData = req.body;

        // Get first user as created_by for now
        const { data: users } = await supabaseAdmin
            .from('users')
            .select('id')
            .limit(1);

        if (!users || users.length === 0) {
            return res.status(400).json({ error: 'No users found' });
        }

        // Only include fields that exist in the database schema
        const allowedFields = [
            'competitor_name', 'industry', 'market_position', 'strengths', 
            'weaknesses', 'opportunities', 'threats', 'key_strategies', 
            'pricing_model', 'target_audience', 'marketing_channels', 'notes'
        ];
        
        const filteredData = {};
        allowedFields.forEach(field => {
            if (competitorData[field] !== undefined && competitorData[field] !== '') {
                filteredData[field] = competitorData[field];
            }
        });

        const { data: competitor, error } = await supabaseAdmin
            .from('competitor_analysis')
            .insert({
                ...filteredData,
                project_id: projectId,
                created_by: users[0].id
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, competitor });
    } catch (error) {
        console.error('Create competitor analysis error:', error);
        res.status(500).json({ error: 'Failed to create competitor analysis' });
    }
});

// PUT - Update competitor
route.put('/projects/:projectId/competitors/:id', async (req, res) => {
    try {
        const { projectId, id } = req.params;
        const competitorData = req.body;
        
        // Only include fields that exist in the database schema
        const allowedFields = [
            'competitor_name', 'industry', 'market_position', 'strengths', 'weaknesses',
            'opportunities', 'threats', 'key_strategies', 'pricing_model', 'target_audience',
            'marketing_channels', 'notes'
        ];
        
        const filteredData = {};
        allowedFields.forEach(field => {
            if (competitorData[field] !== undefined && competitorData[field] !== '') {
                filteredData[field] = competitorData[field];
            }
        });

        const { data: competitor, error } = await supabaseAdmin
            .from('competitor_analysis')
            .update(filteredData)
            .eq('id', id)
            .eq('project_id', projectId)
            .select()
            .single();

        if (error) {
            console.error('Error updating competitor:', error);
            return res.status(500).json({ error: 'Failed to update competitor' });
        }

        res.json(competitor);
    } catch (error) {
        console.error('Error updating competitor:', error);
        res.status(500).json({ error: 'Failed to update competitor' });
    }
});

// DELETE - Delete competitor
route.delete('/projects/:projectId/competitors/:id', async (req, res) => {
    try {
        const { projectId, id } = req.params;

        const { error } = await supabaseAdmin
            .from('competitor_analysis')
            .delete()
            .eq('id', id)
            .eq('project_id', projectId);

        if (error) {
            console.error('Error deleting competitor:', error);
            return res.status(500).json({ error: 'Failed to delete competitor' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting competitor:', error);
        res.status(500).json({ error: 'Failed to delete competitor' });
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

// User endpoint for context management
route.get('/user', async (req, res) => {
    try {
        // For now, return a mock user - replace with real auth later
        const user = {
            id: 1,
            name: 'Admin User',
            email: 'admin@blightstone.com',
            role: 'Administrator'
        };
        res.json(user);
    } catch (error) {
        console.error('User API error:', error);
        res.status(500).json({ error: 'Failed to load user data' });
    }
});

// Diagnostic endpoint for debugging production issues
route.get('/debug', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const diagnostics = {
        environment: process.env.NODE_ENV || 'undefined',
        isProduction: isProduction,
        supabaseUrl: isProduction 
            ? (process.env.SUPABASE_URL_PROD ? 'SET' : 'MISSING')
            : (process.env.SUPABASE_URL ? 'SET' : 'MISSING'),
        supabaseAnonKey: isProduction 
            ? (process.env.SUPABASE_ANON_KEY_PROD ? 'SET' : 'MISSING')
            : (process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING'),
        supabaseServiceKey: isProduction 
            ? (process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ? 'SET' : 'MISSING')
            : (process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'),
        timestamp: new Date().toISOString()
    };
    
    res.json(diagnostics);
});

module.exports = route; 