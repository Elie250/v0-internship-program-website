# Quick Start Guide - Energy & Logics Student Registration System

## System Overview
Complete student registration and admin management system built with Next.js 16, Supabase, and React.

## Testing Credentials

### Admin Account
- **URL**: `/admin/login`
- **Email**: `eliebisamaza@gmail.com`
- **Password**: `energylogics`

### Demo Student Account  
- **URL**: `/student/login`
- **Email**: `student@example.com`
- **Password**: `password123`
- **Status**: Pre-approved (can login immediately)

## Quick Test Flow

### 1. Test Admin Dashboard (2 minutes)
1. Go to `/admin/login`
2. Login with admin credentials above
3. View dashboard statistics
4. Click "Applications" tab to see all registrations
5. Try searching for a student
6. Click on a student to view details
7. Go to "Permissions" tab
8. Grant webinar access to an approved student
9. Click "Save All Permissions"
10. Logout

### 2. Test Student Registration (3 minutes)
1. Go to `/register`
2. Fill Step 1: Personal Info
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@example.com
   - Phone: +250 780 000 000
   - DOB: 2000-01-01
   - Gender: Male
3. Click "Next Step"
4. Fill Step 2: Address
   - National ID: 1234567890
   - Address: 123 Main Street
   - City: Kigali
   - Province: Kigali City
   - Postal Code: 00000
5. Click "Next Step"
6. Fill Step 3: Education
   - School: University of Rwanda
   - Field: Engineering
   - Level: Bachelor
   - Program: Embedded Systems
   - Duration: 6 months
7. Click "Next Step"
8. Fill Step 4: Account
   - Password: Test@1234
   - Confirm Password: Test@1234
   - Check "I agree to terms"
9. Click "Submit Application"
10. See success page

### 3. Test Student Login (1 minute)
1. Go to `/student/login`
2. Email: `student@example.com`
3. Password: `password123`
4. See "Login successful"
5. Redirected to student dashboard

### 4. Test Permission System (2 minutes)
1. Login as admin
2. Go to Applications tab
3. Find and approve a pending application (if any)
4. Go to Permissions tab
5. Toggle "Webinars" for the newly approved student
6. Click "Save All Permissions"
7. Logout and login as that student
8. Should see webinar access granted

## Key Features to Test

### Admin Dashboard
- [ ] Login works without redirect loops
- [ ] Can view all applications
- [ ] Can search by name/email
- [ ] Can update application status
- [ ] Can view student details
- [ ] Can manage student permissions
- [ ] Can grant webinar access
- [ ] Can save permissions
- [ ] Logout works

### Registration Form
- [ ] All 4 steps render
- [ ] Form fields display correctly
- [ ] Validation shows error messages
- [ ] Can proceed through all steps
- [ ] Can submit and see success page
- [ ] No console errors

### Student Login
- [ ] Demo account works
- [ ] Cannot login if not approved
- [ ] Can login after approval
- [ ] Token saved to localStorage
- [ ] Redirects to dashboard

### Program Enrollment
- [ ] Programs page loads
- [ ] "Enroll Now" button goes to `/register`
- [ ] All program information displays

## Common Issues & Solutions

### "Infinite redirect loop" on admin login
**Solution**: Ensure localStorage is being set correctly
```javascript
// Check in browser console:
localStorage.getItem('admin_authenticated') // Should return 'true'
```

### "404 on Create Account" button
**Solution**: Button should link to `/register`, not `/internships`
- Check: `app/student/login/page.tsx` line 108
- Should have: `href="/register"`

### Registration form shows only steps, no fields
**Solution**: Form fields should render for each step
- Check: `app/register/page.tsx` lines 117-489
- Each step should have Input/Select components

### Student can't login
**Solution**: Check if student is approved
1. Login as admin
2. Go to Applications tab
3. Find student
4. Check if status is "Approved"
5. If "Pending", change to "Approved"
6. Try student login again

### Email already registered error
**Solution**: Use a different email or check Supabase applications table
```sql
-- Check in Supabase SQL:
SELECT email, status FROM applications ORDER BY created_at DESC LIMIT 10;
```

## API Endpoints Reference

### Register Student
```bash
POST /api/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "secure_password123",
  ...
}
```

### Login Student
```bash
POST /api/student-login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

### Get Applications (Admin)
```bash
GET /api/admin/registrations
Authorization: Bearer <admin_token>
```

### Update Status (Admin)
```bash
PATCH /api/admin/registrations
Authorization: Bearer <admin_token>

{
  "id": "student-id",
  "status": "Approved"
}
```

## Database Queries

### Check All Applications
```sql
SELECT id, full_name, email, program, status, created_at
FROM applications
ORDER BY created_at DESC;
```

### Check Pending Applications
```sql
SELECT full_name, email, program
FROM applications
WHERE status = 'Pending';
```

### Update Student Status
```sql
UPDATE applications
SET status = 'Approved'
WHERE email = 'john@example.com';
```

## Browser Console Debugging

### Check Admin Authentication
```javascript
localStorage.getItem('admin_authenticated')
```

### Check Student Token
```javascript
localStorage.getItem('student_auth_token')
localStorage.getItem('student_id')
localStorage.getItem('student_email')
```

### Check Student Permissions
```javascript
JSON.parse(localStorage.getItem('student_permissions'))
```

### Clear All Session Data
```javascript
localStorage.clear()
sessionStorage.clear()
```

## Development Setup

### Prerequisites
- Node.js 24.x
- npm or yarn
- Supabase account

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Key Routes
- Home: `/`
- Programs: `/programs`
- Register: `/register`
- Student Login: `/student/login`
- Admin Login: `/admin/login`
- Admin Dashboard: `/admin/dashboard`
- Student Dashboard: `/student/dashboard`

## Performance Notes

- Registration form uses client-side validation
- Admin dashboard loads from localStorage (fast)
- Student data synced with Supabase on registration
- Permissions stored in localStorage (can be moved to Supabase)
- No external API calls except Supabase

## Next Steps

1. **Move to Production**
   - Update admin credentials in `app/admin/login/page.tsx`
   - Set up proper JWT tokens instead of simple tokens
   - Enable email verification on registration
   - Configure Supabase RLS policies

2. **Enhance Features**
   - Add email notifications on application status change
   - Implement password reset
   - Add two-factor authentication
   - Create student certificate system

3. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor API performance
   - Track user conversions
   - Log admin actions

## Pre-Deployment Checklist

- ✅ All environment variables configured
- ✅ Supabase tables created
- ✅ Admin credentials set
- ✅ Registration form working
- ✅ Student login working
- ✅ Admin dashboard functional
- ✅ Permission system working
- ✅ No console errors
- ✅ All redirects correct
- ✅ Responsive design verified

## Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase dashboard for database issues
3. Check environment variables in Vercel settings
4. Review API response in Network tab
5. Check application logs in Vercel dashboard

---

**Version**: 1.0.0
**Last Updated**: April 3, 2025
**Status**: ✅ Ready for Testing & Deployment
