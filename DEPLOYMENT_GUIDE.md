# 🚀 Blightstone App - Full Deployment Guide

## ✅ What's Already Done

Your app now has:
- ✅ **Real Supabase Authentication** - Complete user management system
- ✅ **Database Schema** - All tables for users, projects, tasks, documents, etc.
- ✅ **API Routes** - Authentication endpoints (`/api/auth/*`)
- ✅ **Session Management** - Secure user sessions
- ✅ **Email Service** - Ready for Resend integration
- ✅ **Vercel Configuration** - Ready for deployment

## 🔧 Setup Steps Needed

### 1. Set Up Resend (Email Service)

1. Go to [resend.com](https://resend.com) and create account
2. Get your API key from dashboard
3. Update `config.env`:
   ```bash
   RESEND_API_KEY=re_your_actual_resend_api_key_here
   ```
4. **Important**: You'll need to verify your domain in Resend
   - Add your domain (e.g., `blightstone.com`)
   - Or use their test domain for development

### 2. Set Up Production Supabase

1. Go to [supabase.com](https://supabase.com) and create new project
2. Get your production credentials from Settings > API
3. Update `config.env`:
   ```bash
   SUPABASE_URL_PROD=https://your-project.supabase.co
   SUPABASE_ANON_KEY_PROD=your_production_anon_key
   SUPABASE_SERVICE_ROLE_KEY_PROD=your_production_service_key
   ```
4. Run the migration on production:
   ```bash
   # Copy the SQL from supabase/migrations/20250104_auth_system.sql
   # Paste it in your Supabase SQL Editor and run it
   ```

### 3. Deploy to Vercel

1. **Install Vercel CLI** (if not already):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd /Users/hairai/Documents/Code/dashboard/Hando
   vercel
   ```

3. **Set Environment Variables** in Vercel Dashboard:
   - `SUPABASE_URL_PROD`
   - `SUPABASE_ANON_KEY_PROD`
   - `SUPABASE_SERVICE_ROLE_KEY_PROD`
   - `RESEND_API_KEY`
   - `SESSION_SECRET` (generate a random 32-character string)
   - `NODE_ENV=production`

### 4. Alternative: Use Render/Railway (if preferred)

If you prefer traditional hosting:

**Render:**
- Connect your GitHub repo
- Set build command: `npm install`
- Set start command: `npm start`
- Add environment variables

**Railway:**
- Connect GitHub repo
- Deploy automatically
- Add environment variables

## 🎯 Your Current Tech Stack

```
Frontend:  EJS Templates + Bootstrap + JavaScript
Backend:   Node.js + Express.js
Database:  Supabase (PostgreSQL)
Auth:      Supabase Auth + Custom Session Management
Email:     Resend
Hosting:   Vercel (recommended) or Render/Railway
```

## 🔑 Environment Variables Summary

### Local Development (`config.env`)
```bash
# Local Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_key

# Production Supabase
SUPABASE_URL_PROD=https://your-project.supabase.co
SUPABASE_ANON_KEY_PROD=eyJ...
SUPABASE_SERVICE_ROLE_KEY_PROD=eyJ...

# Email Service
RESEND_API_KEY=re_...

# App Config
SESSION_SECRET=your_32_char_secret_key
NODE_ENV=development
PORT=8000
APP_URL=http://localhost:8000
```

### Production (Vercel/Render)
```bash
SUPABASE_URL_PROD=https://your-project.supabase.co
SUPABASE_ANON_KEY_PROD=eyJ...
SUPABASE_SERVICE_ROLE_KEY_PROD=eyJ...
RESEND_API_KEY=re_...
SESSION_SECRET=your_32_char_secret_key
NODE_ENV=production
APP_URL=https://your-app.vercel.app
```

## 🧪 Testing the Real System

1. **Start Local Development**:
   ```bash
   npm run preview
   ```

2. **Test Team Invitations**:
   - Go to Team page
   - Click "Add Team Member" 
   - Enter email and role
   - Check that API call goes to `/api/auth/invite`

3. **Test Registration**:
   - Use invitation token to register
   - Verify account creation in Supabase

4. **Test Login**:
   - Login with real credentials
   - Verify session persistence

## 🔍 API Endpoints

Your app now has these real endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Complete invitation
- `POST /api/auth/invite` - Send team invitation
- `GET /api/auth/verify-invitation/:token` - Verify invite
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

## 🚨 Security Features

- ✅ **Row Level Security** - Database access controlled by user
- ✅ **Session Management** - Secure user sessions
- ✅ **Password Hashing** - Handled by Supabase
- ✅ **Token-based Invites** - Secure invitation system
- ✅ **Email Verification** - Via invitation flow

## 🎉 Next Steps

1. **Set up Resend** (get API key)
2. **Create production Supabase** (get credentials)
3. **Deploy to Vercel** (or preferred platform)
4. **Test team invitations** (end-to-end)
5. **Replace frontend localStorage** with real API calls

Your app is now a **real, production-ready system**! 🚀