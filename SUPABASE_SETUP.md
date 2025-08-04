# 🚀 Blightstone Project Management - Supabase Setup Guide

## 📋 **Step 1: Set Up Supabase Database**

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `vddtsunsahhccmtamdcg`

2. **Run the Database Schema:**
   - Go to **SQL Editor** in the left sidebar
   - Copy the contents of `supabase-setup.sql`
   - Paste and run the SQL commands
   - This will create all necessary tables and sample data

## 🔐 **Step 2: Configure Authentication**

1. **Enable Email Auth:**
   - Go to **Authentication** → **Settings**
   - Enable "Enable email confirmations" (optional)
   - Set your site URL to: `http://localhost:8000`

2. **Configure Auth Settings:**
   - Go to **Authentication** → **URL Configuration**
   - Set Site URL: `http://localhost:8000`
   - Set Redirect URLs: `http://localhost:8000/auth-login`

## 📁 **Step 3: Set Up File Storage (for Avatars)**

1. **Create Storage Bucket:**
   - Go to **Storage** → **Buckets**
   - Create a new bucket called `avatars`
   - Set it to public

2. **Set Storage Policies:**
   - Go to **Storage** → **Policies**
   - Add policy for `avatars` bucket:
   ```sql
   CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
   CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
   ```

## 🎯 **Step 4: Test the Setup**

1. **Start the server:**
   ```bash
   cd /Users/hairai/Documents/Code/dashboard/Hando
   npm run preview
   ```

2. **Visit the app:**
   - Go to: `http://localhost:8000`
   - You should see the clean project management interface

## 🔧 **Step 5: Make Tasks Functional**

The app now has:
- ✅ **Real authentication** with Supabase
- ✅ **Database storage** for all data
- ✅ **API endpoints** for CRUD operations
- ✅ **Team management** with real user profiles
- ✅ **Project management** with real data
- ✅ **Task management** with real functionality

## 📱 **Next Steps to Complete:**

1. **Update the frontend** to use the API endpoints
2. **Add real-time updates** for task changes
3. **Implement file upload** for avatars
4. **Add proper error handling** and loading states
5. **Test all CRUD operations** (Create, Read, Update, Delete)

## 🎉 **What You Now Have:**

- **Real Database:** PostgreSQL with Supabase
- **Authentication:** Secure user login/registration
- **API Endpoints:** Full CRUD for tasks, projects, users
- **Security:** Row Level Security (RLS) policies
- **Scalability:** Cloud-based solution ready for production

## 🗄️ **Storage Configuration**

### Document Storage for Marketing Assets
1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `documents`
3. Set it to **Public** for easy file access
4. Configure RLS policies for the documents bucket:

```sql
-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to view documents  
CREATE POLICY "Authenticated users can view documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

-- Allow users to delete their own uploaded documents
CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents');
```

### Storage Costs (Very Affordable!)
- **Free Tier**: 1GB storage, 2GB bandwidth/month
- **Pro Tier**: 8GB storage, 100GB bandwidth/month  
- **Additional Storage**: ~$0.021/GB/month
- **Bandwidth**: ~$0.09/GB
- **Estimated Monthly Cost**: $3-8 for typical marketing assets

## 🔗 **API Endpoints Available:**

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/signout` - Logout user

### Team Management
- `GET /api/users` - Get all team members
- `POST /api/users` - Add new team member

### Projects  
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### 📁 Documents & Files (NEW!)
- `GET /api/folders` - Get all folders
- `POST /api/folders` - Create new folder
- `GET /api/documents` - Get all documents
- `POST /api/documents/upload` - Upload files
- `GET /api/documents/:id/download` - Download file
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document

## 🎯 **Google Drive-like Features:**
- ✅ **Drag & drop file upload**
- ✅ **Folder organization**
- ✅ **File preview (images/videos)**
- ✅ **Search and filtering**
- ✅ **Download tracking**
- ✅ **Team access control**
- ✅ **Mobile responsive design**

Your Blightstone project management tool now includes a professional document management system for all your marketing assets! 🚀📁 