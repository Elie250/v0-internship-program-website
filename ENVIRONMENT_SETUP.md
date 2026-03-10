# Environment Setup Guide

## Required Environment Variables

Your Energy & Logics Admin Dashboard requires the following environment variables to be configured:

### 1. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Where to get these:**
- Go to your Supabase project dashboard
- Navigate to "Settings" → "API"
- Copy the Project URL and Anon Key (public)
- Copy the Service Role Key (keep this secret)

### 2. Email Service (Resend)
```
RESEND_API_KEY=your_resend_api_key
```

**Where to get this:**
- Sign up at [Resend](https://resend.com)
- Navigate to "API Keys" in your dashboard
- Create a new API key with email sending permissions
- This is used for sending acceptance/decline emails to applicants

### 3. Authentication
The application uses basic email/password authentication. The admin credentials are stored in the Supabase database.

---

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
# or
pnpm install
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Service (Required for email notifications)
RESEND_API_KEY=your-resend-api-key
```

### Step 3: Set Up Supabase Database

If you haven't already created the registrations table, run these SQL commands in your Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  registration_type VARCHAR(50) CHECK (registration_type IN ('Student', 'Individual')),
  school VARCHAR(255),
  profession VARCHAR(255),
  program VARCHAR(255),
  training_program VARCHAR(255),
  level VARCHAR(100),
  duration VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  certificate_generated BOOLEAN DEFAULT FALSE,
  certificate_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX registrations_email_idx ON registrations(email);
CREATE INDEX registrations_status_idx ON registrations(status);
CREATE INDEX registrations_created_at_idx ON registrations(created_at);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
```

### Step 4: Create Admin User

Create an admin user in your Supabase auth:

1. Go to Supabase Dashboard → "Authentication" → "Users"
2. Click "Add user" or use the API
3. Create a user with an email and password
4. Remember the credentials for logging into the dashboard

### Step 5: Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Navigate to `http://localhost:3000` in your browser.

---

## Environment Variables Verification

Before deploying, verify all environment variables are set:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)
- [ ] `RESEND_API_KEY` - Resend API key for email sending

---

## Deployment to Vercel

### Step 1: Connect Repository
1. Go to [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Select this project

### Step 2: Add Environment Variables
In the Vercel dashboard:
1. Navigate to "Settings" → "Environment Variables"
2. Add all required environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - RESEND_API_KEY

**Important:** Use the same values as your local `.env.local` file.

### Step 3: Deploy
1. Push your code to your main branch
2. Vercel will automatically deploy
3. Access your application at the provided URL

---

## Verification Checklist

After setup, verify everything works:

### Local Development
- [ ] Dashboard loads without errors
- [ ] Can log in with admin credentials
- [ ] Can view applications list
- [ ] Can filter and search applications
- [ ] Charts display correctly
- [ ] Can accept/decline applications
- [ ] Emails are sent (check Resend dashboard)
- [ ] Can export to CSV and PDF
- [ ] Can view statistics

### Production (Vercel)
- [ ] All environment variables are configured
- [ ] Build completes without errors
- [ ] Dashboard is accessible
- [ ] All features work as expected
- [ ] Database connection is working

---

## Troubleshooting

### "Failed to load dashboard data"
**Issue:** Cannot connect to Supabase
**Solution:** 
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check Supabase project status
- Ensure registrations table exists

### "Email send failed"
**Issue:** Emails are not being sent
**Solution:**
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for API key status
- Verify email recipient address is valid

### "Port already in use"
**Issue:** Port 3000 is occupied
**Solution:**
```bash
# Use a different port
npm run dev -- -p 3001
```

### Database Connection Error
**Issue:** Cannot connect to database
**Solution:**
- Check internet connection
- Verify Supabase credentials
- Check if registrations table exists in database

---

## Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore` (already done)
2. **Use strong passwords** - For admin accounts
3. **Rotate API keys regularly** - Especially service role keys
4. **Use RLS** - Enable Row Level Security in Supabase
5. **HTTPS only** - Always use HTTPS in production
6. **Rate limiting** - Consider adding rate limiting for email sends

---

## Support

If you encounter issues:
1. Check the documentation files in this project
2. Review the IMPLEMENTATION_SUMMARY.md for technical details
3. Check Supabase and Resend dashboards for error logs
4. Review browser console for client-side errors

---

Last Updated: January 2026
