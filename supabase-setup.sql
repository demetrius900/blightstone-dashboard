-- Blightstone Project Management Database Schema
-- Run this in your Supabase SQL Editor

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100) DEFAULT 'Team Member',
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    priority VARCHAR(20) DEFAULT 'Medium',
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create folders table for document organization
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, parent_id)
);

-- Create documents table for file management
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id),
    tags TEXT[], -- Array of tags for better organization
    description TEXT,
    thumbnail_url TEXT, -- For image/video previews
    metadata JSONB, -- Store additional file metadata
    download_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document shares table for access control
CREATE TABLE IF NOT EXISTS public.document_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES public.users(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'view', -- 'view', 'edit', 'admin'
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, shared_with)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all team members" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can view all projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update projects they created" ON public.projects FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete projects they created" ON public.projects FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for tasks table
CREATE POLICY "Users can view all tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update tasks they created or are assigned to" ON public.tasks FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);
CREATE POLICY "Users can delete tasks they created" ON public.tasks FOR DELETE USING (auth.uid() = created_by);

-- Create a demo user in auth.users first (this needs to be done via Supabase dashboard)
-- Then insert profile data
-- Note: The user ID here is a placeholder - replace with actual auth user ID after creating user

-- Insert sample projects (no user dependency)
INSERT INTO public.projects (name, description, status, start_date, end_date) VALUES
    ('Website Redesign', 'Complete overhaul of company website', 'Active', '2024-12-01', '2025-03-01'),
    ('Product Launch', 'Launch new product line', 'Active', '2024-11-15', '2025-01-15'),
    ('Q4 Campaign', 'Marketing campaign for Q4', 'Active', '2024-10-01', '2024-12-31');

-- Insert sample tasks (no user assignment initially)
INSERT INTO public.tasks (title, description, status, priority, project_id, due_date) VALUES
    ('Design new landing page', 'Create modern landing page design', 'In Progress', 'High', (SELECT id FROM public.projects WHERE name = 'Website Redesign' LIMIT 1), '2024-12-15'),
    ('Update user documentation', 'Update API documentation', 'Completed', 'Medium', (SELECT id FROM public.projects WHERE name = 'Product Launch' LIMIT 1), '2024-12-12'),
    ('Review marketing materials', 'Review and approve marketing content', 'Pending', 'High', (SELECT id FROM public.projects WHERE name = 'Q4 Campaign' LIMIT 1), '2024-12-18'),
    ('Setup database backup', 'Configure automated database backups', 'Completed', 'High', (SELECT id FROM public.projects WHERE name = 'Website Redesign' LIMIT 1), '2024-12-10'),
    ('Create marketing wireframes', 'Design wireframes for campaign materials', 'Pending', 'Medium', (SELECT id FROM public.projects WHERE name = 'Q4 Campaign' LIMIT 1), '2024-12-20');

-- RLS Policies for folders table
CREATE POLICY "Users can view all folders" ON public.folders FOR SELECT USING (true);
CREATE POLICY "Users can create folders" ON public.folders FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update folders they created" ON public.folders FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete folders they created" ON public.folders FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for documents table
CREATE POLICY "Users can view all documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Users can upload documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update documents they uploaded" ON public.documents FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can delete documents they uploaded" ON public.documents FOR DELETE USING (auth.uid() = uploaded_by);

-- RLS Policies for document_shares table
CREATE POLICY "Users can view shares for documents they have access to" ON public.document_shares FOR SELECT USING (auth.uid() = shared_with OR auth.uid() = created_by);
CREATE POLICY "Users can create shares for documents they uploaded" ON public.document_shares FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can delete shares they created" ON public.document_shares FOR DELETE USING (auth.uid() = created_by);

-- Insert sample folders for marketing assets
INSERT INTO public.folders (name, description, project_id) VALUES
    ('Marketing Assets', 'All marketing materials and creative assets', NULL),
    ('Video Content', 'Video ads, product demos, and promotional videos', (SELECT id FROM public.projects WHERE name = 'Q4 Campaign' LIMIT 1)),
    ('Images & Graphics', 'Product photos, banners, and graphic designs', (SELECT id FROM public.projects WHERE name = 'Product Launch' LIMIT 1)),
    ('Brand Resources', 'Logos, brand guidelines, and templates', NULL),
    ('Campaign Materials', 'Specific campaign assets and variations', (SELECT id FROM public.projects WHERE name = 'Q4 Campaign' LIMIT 1));

-- Note: Sample documents will be added after users upload files
-- The document URLs will be generated by Supabase Storage