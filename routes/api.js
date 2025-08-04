const express = require('express');
const router = express.Router();
const { users, projects, tasks, folders, documents, auth, supabase } = require('../models/database');

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// Authentication routes
router.post('/auth/signup', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        const { user } = await auth.signUp(email, password, { name, role });
        
        if (user) {
            // Create user profile
            await users.create({
                id: user.id,
                name,
                email,
                role: role || 'Team Member'
            });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/auth/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, session } = await auth.signIn(email, password);
        res.json({ success: true, user, session });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/auth/signout', async (req, res) => {
    try {
        await auth.signOut();
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Team Members (Users) routes
router.get('/users', requireAuth, async (req, res) => {
    try {
        const teamMembers = await users.getAll();
        res.json(teamMembers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/users', requireAuth, async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const newUser = await users.create({
            name,
            email,
            role: role || 'Team Member',
            status: 'Active'
        });
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/users/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedUser = await users.update(id, updates);
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/users/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await users.delete(id);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Projects routes
router.get('/projects', requireAuth, async (req, res) => {
    try {
        const projectList = await projects.getAll();
        res.json(projectList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/projects', requireAuth, async (req, res) => {
    try {
        const { name, description, start_date, end_date } = req.body;
        const newProject = await projects.create({
            name,
            description,
            start_date,
            end_date,
            created_by: req.user.id,
            status: 'Active'
        });
        res.json(newProject);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/projects/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedProject = await projects.update(id, updates);
        res.json(updatedProject);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/projects/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await projects.delete(id);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Tasks routes
router.get('/tasks', requireAuth, async (req, res) => {
    try {
        const taskList = await tasks.getAll();
        res.json(taskList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/tasks', requireAuth, async (req, res) => {
    try {
        const { title, description, project_id, assigned_to, due_date, priority } = req.body;
        const newTask = await tasks.create({
            title,
            description,
            project_id,
            assigned_to,
            due_date,
            priority: priority || 'Medium',
            status: 'Pending',
            created_by: req.user.id
        });
        res.json(newTask);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/tasks/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // If marking as completed, add completed_at timestamp
        if (updates.status === 'Completed' && !updates.completed_at) {
            updates.completed_at = new Date().toISOString();
        }
        
        const updatedTask = await tasks.update(id, updates);
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/tasks/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await tasks.delete(id);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get tasks by project
router.get('/projects/:id/tasks', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const projectTasks = await tasks.getByProject(id);
        res.json(projectTasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Folders routes
router.get('/folders', requireAuth, async (req, res) => {
    try {
        const { project_id } = req.query;
        const allFolders = await folders.getAll(project_id);
        res.json(allFolders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/folders', requireAuth, async (req, res) => {
    try {
        const folderData = {
            ...req.body,
            created_by: req.user.id
        };
        const newFolder = await folders.create(folderData);
        res.json(newFolder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/folders/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const folder = await folders.getById(id);
        res.json(folder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/folders/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedFolder = await folders.update(id, updates);
        res.json(updatedFolder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/folders/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await folders.delete(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Documents routes
router.get('/documents', requireAuth, async (req, res) => {
    try {
        const { folder_id, project_id, search } = req.query;
        
        let docs;
        if (search) {
            docs = await documents.search(search, project_id);
        } else {
            docs = await documents.getAll(folder_id, project_id);
        }
        
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/documents/upload', requireAuth, async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.files.file;
        const { folder_id, project_id, description, tags } = req.body;
        
        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `documents/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file.data, {
                contentType: file.mimetype,
                cacheControl: '3600'
            });

        if (uploadError) {
            throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        // Create document record
        const documentData = {
            name: fileName,
            original_name: file.name,
            file_type: file.mimetype,
            file_size: file.size,
            file_url: publicUrl,
            folder_id: folder_id || null,
            project_id: project_id || null,
            uploaded_by: req.user.id,
            description: description || '',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        };

        const newDocument = await documents.create(documentData);
        res.json(newDocument);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/documents/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const document = await documents.getById(id);
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/documents/:id/download', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const document = await documents.getById(id);
        
        // Increment download count
        await documents.incrementDownloads(id);
        
        // Redirect to file URL or serve file
        res.redirect(document.file_url);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/documents/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Parse tags if provided
        if (updates.tags && typeof updates.tags === 'string') {
            updates.tags = updates.tags.split(',').map(tag => tag.trim());
        }
        
        const updatedDocument = await documents.update(id, updates);
        res.json(updatedDocument);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/documents/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const document = await documents.getById(id);
        
        // Delete from Supabase Storage
        const filePath = document.file_url.split('/').pop();
        await supabase.storage
            .from('documents')
            .remove([`documents/${filePath}`]);
        
        // Delete from database
        await documents.delete(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 