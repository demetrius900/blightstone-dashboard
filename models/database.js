const supabase = require('../config/supabase');

// Database Models and Functions

// Users/Team Members
const users = {
    // Get all team members
    async getAll() {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // Get user by ID
    async getById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Create new user
    async create(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Update user
    async update(id, updates) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Delete user
    async delete(id) {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
};

// Projects
const projects = {
    // Get all projects
    async getAll() {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // Get project by ID
    async getById(id) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Create new project
    async create(projectData) {
        const { data, error } = await supabase
            .from('projects')
            .insert([projectData])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Update project
    async update(id, updates) {
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Delete project
    async delete(id) {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
};

// Tasks
const tasks = {
    // Get all tasks
    async getAll() {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                projects(name),
                users(name, avatar_url)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // Get task by ID
    async getById(id) {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                projects(name),
                users(name, avatar_url)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Create new task
    async create(taskData) {
        const { data, error } = await supabase
            .from('tasks')
            .insert([taskData])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Update task
    async update(id, updates) {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Delete task
    async delete(id) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    // Get tasks by project
    async getByProject(projectId) {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                users(name, avatar_url)
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }
};

// Folders
const folders = {
    // Get all folders
    async getAll(projectId = null) {
        let query = supabase
            .from('folders')
            .select('*')
            .order('name');
        
        if (projectId) {
            query = query.eq('project_id', projectId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Get folder by ID
    async getById(id) {
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Create new folder
    async create(folderData) {
        const { data, error } = await supabase
            .from('folders')
            .insert([folderData])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Update folder
    async update(id, updates) {
        const { data, error } = await supabase
            .from('folders')
            .update(updates)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Delete folder
    async delete(id) {
        const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
};

// Documents
const documents = {
    // Get all documents
    async getAll(folderId = null, projectId = null) {
        let query = supabase
            .from('documents')
            .select(`
                *,
                folders(name),
                projects(name),
                users(name, email, avatar_url)
            `)
            .order('created_at', { ascending: false });
        
        if (folderId) {
            query = query.eq('folder_id', folderId);
        }
        if (projectId) {
            query = query.eq('project_id', projectId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Get document by ID
    async getById(id) {
        const { data, error } = await supabase
            .from('documents')
            .select(`
                *,
                folders(name),
                projects(name),
                users(name, email, avatar_url)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Create new document
    async create(documentData) {
        const { data, error } = await supabase
            .from('documents')
            .insert([documentData])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Update document
    async update(id, updates) {
        const { data, error } = await supabase
            .from('documents')
            .update(updates)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    },

    // Delete document
    async delete(id) {
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    // Search documents
    async search(searchTerm, projectId = null) {
        let query = supabase
            .from('documents')
            .select(`
                *,
                folders(name),
                projects(name),
                users(name, email, avatar_url)
            `)
            .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false });
        
        if (projectId) {
            query = query.eq('project_id', projectId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Increment download count
    async incrementDownloads(id) {
        const { data, error } = await supabase
            .from('documents')
            .update({ 
                download_count: supabase.raw('download_count + 1') 
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    }
};

// Authentication
const auth = {
    // Sign up new user
    async signUp(email, password, userData = {}) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        
        if (error) throw error;
        return data;
    },

    // Sign in user
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        return data;
    },

    // Sign out user
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return true;
    },

    // Get current user
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    // Get current session
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    }
};

module.exports = {
    users,
    projects,
    tasks,
    folders,
    documents,
    auth,
    supabase
}; 