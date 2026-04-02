# Energy & Logics Platform - Authentication & User Management Guide

## Overview
The platform now includes complete student authentication, enhanced registration, and admin user management capabilities.

---

## Student Login & Dashboard

### How Students Access Their Dashboard

1. **Access Student Login**
   - Navigate to: `/student/login`
   - Or click "Student Login" button in the navbar
   - Demo credentials:
     - Email: `student@example.com`
     - Password: `password123`

2. **Login Process**
   - Enter email address and password
   - Click "Login to Dashboard"
   - System verifies credentials against Supabase `registrations` table
   - On success: Student is redirected to `/student/dashboard`
   - Token stored in localStorage for session management

3. **Student Dashboard Features**
   - **Profile Information**: View personal details
   - **Progress Tracking**: Real-time progress visualization (0-100%)
   - **Time Tracking**: Log internship hours
   - **Active Assignments**: View current assignments
   - **Notifications**: Check messages and updates
   - **Learning Resources**: Access training materials, webinars, reports, and support
   - **Logout**: Secure logout clears authentication tokens

---

## Student Registration

### Enhanced Registration Form (4-Step Process)

1. **Step 1: Personal Information**
   - First Name *
   - Last Name *
   - Email Address *
   - Phone Number *
   - Date of Birth *
   - Gender *

2. **Step 2: Address Details**
   - National ID Number *
   - Street Address *
   - City *
   - Province/District *
   - Postal Code *
   - Country (pre-filled: Rwanda)

3. **Step 3: Education & Program**
   - School/University Name *
   - Field of Study *
   - Education Level * (Secondary, Diploma, Bachelor, Master)
   - Program * (Embedded Systems, Industrial Automation, IoT Solutions)
   - Preferred Duration * (3-6 months)

4. **Step 4: Account Creation**
   - Create Password * (minimum 6 characters)
   - Confirm Password *
   - Agree to Terms & Conditions *

### Registration Process
- Access at: `/register`
- Or click "Apply Now" button
- Form validation at each step
- On submission: Data sent to `/api/register` endpoint
- Data stored in Supabase `registrations` table
- Redirect to success page: `/register/success`
- Confirmation email sent to registered email

### Registration Success Page
- Shows registration confirmation
- Displays what happens next
- Provides next steps timeline
- Links to student dashboard and home page

---

## Admin User Management

### Admin Access
1. **Login to Admin Panel**
   - Navigate to: `/admin/login`
   - Or click "Admin" button in navbar
   - Credentials:
     - Email: `eliebisamaza@gmail.com`
     - Password: `energylogics`

2. **Admin Dashboard**
   - Access: `/admin/users`
   - Full user management interface

### Admin Features

#### 1. **User Statistics**
   - Total Students count
   - Active students count
   - Pending applications count
   - Mentor count

#### 2. **Search & Filter**
   - Search students by name or email
   - Filter by status (All, Pending, Approved, Active, Suspended, Rejected)

#### 3. **Student Management Table**
   - View all registered students
   - Student Name
   - Email Address
   - Program Enrolled
   - Current Status (dropdown - change status in real-time)
   - Permission Level (Student, Mentor, Admin)
   - Hours Logged
   - Action Buttons

#### 4. **Permission Management**
   - **Student**: Standard access to dashboard, training materials
   - **Mentor**: Can guide students, approve assignments, track progress
   - **Admin**: Full system access, manage all users and settings
   - Update permissions by:
     1. Click "Perms" button on student row
     2. Select new permission level
     3. Confirm changes

#### 5. **Status Management**
   - Pending: Application under review
   - Approved: Ready to start
   - Active: Currently participating
   - Suspended: Temporarily restricted
   - Rejected: Not accepted
   - Change status directly from dropdown menu

#### 6. **User Actions**
   - **Edit Permissions**: Update user role (Student/Mentor/Admin)
   - **Delete**: Remove student record from system

---

## Database Integration

### Supabase Tables

#### `registrations` Table
```
- id: UUID (Primary Key)
- first_name: Text
- last_name: Text
- name: Text (Full name)
- email: Text (Unique)
- phone: Text
- date_of_birth: Date
- gender: Text
- national_id: Text
- address: Text
- city: Text
- province: Text
- postal_code: Text
- country: Text
- school: Text
- field_of_study: Text
- education_level: Text
- program_name: Text
- program: Text
- duration: Text
- password_hash: Text
- registration_status: Text (Pending, Approved, Active, Suspended, Rejected)
- status: Text
- agreement_confirmed: Boolean
- created_at: Timestamp
```

### API Endpoints

#### 1. **Student Login**
- **Route**: `POST /api/student-login`
- **Input**: 
  ```json
  {
    "email": "student@example.com",
    "password": "password123"
  }
  ```
- **Output**: 
  ```json
  {
    "success": true,
    "token": "token_id",
    "student_id": "uuid",
    "name": "Student Name",
    "email": "email@example.com"
  }
  ```

#### 2. **Student Registration**
- **Route**: `POST /api/register`
- **Input**: Complete registration form data
- **Output**: 
  ```json
  {
    "success": true,
    "message": "Registration submitted successfully",
    "student_id": "uuid"
  }
  ```

---

## Security Notes

1. **Password Storage**
   - Currently using Base64 encoding (demonstration)
   - **Production**: Should use bcrypt or similar hashing
   - Never store plain-text passwords

2. **Session Management**
   - Tokens stored in localStorage
   - **Production**: Use HTTP-only cookies
   - Implement token expiration (15-30 minutes)

3. **Authentication Guards**
   - Student dashboard requires valid token
   - Admin panel requires admin authentication
   - Unauthorized access redirected to login

4. **Data Validation**
   - All form fields validated client-side
   - Email uniqueness enforced
   - Password minimum length requirement (6 characters)

---

## Navigation Structure

```
├── Home (/)
├── Public Pages
│   ├── About (/about)
│   ├── Webinars (/webinars)
│   ├── Training Programs (/training-programs)
│   ├── Internships (/internships)
│   ├── Services (/services)
│   ├── Projects (/projects)
│   └── Blog (/blog)
├── Student Portal
│   ├── Student Login (/student/login)
│   ├── Dashboard (/student/dashboard)
│   └── Registration (/register)
│       └── Success (/register/success)
└── Admin Portal
    ├── Admin Login (/admin/login)
    ├── User Management (/admin/users)
    └── Dashboard (/admin/dashboard)
```

---

## Testing Credentials

### Student Account
- Email: `student@example.com`
- Password: `password123`

### Admin Account
- Email: `eliebisamaza@gmail.com`
- Password: `energylogics`

---

## Frontend Features Fixed

1. ✅ **Footer Icons**: Fixed lucide-react imports (Linkedin, Twitter, Facebook)
2. ✅ **Student Login**: Fully functional login with token management
3. ✅ **Enhanced Registration**: 4-step form with all required fields
4. ✅ **Student Dashboard**: Progress tracking, hours logging, resources access
5. ✅ **Admin User Management**: Full CRUD operations for students
6. ✅ **Permission System**: Student, Mentor, Admin roles
7. ✅ **Status Management**: 5-state status system for students
8. ✅ **Navigation**: Updated navbar with student and admin links
9. ✅ **Database Integration**: All forms connected to Supabase

---

## Next Steps for Production

1. **Implement Bcrypt Password Hashing**
   ```bash
   npm install bcrypt @types/bcrypt
   ```

2. **Add JWT Token Management**
   ```bash
   npm install jsonwebtoken @types/jsonwebtoken
   ```

3. **Implement HTTP-Only Cookies**
   - Replace localStorage with cookies
   - Add CSRF protection

4. **Add Email Verification**
   - Send verification emails on registration
   - Verify email before enabling login

5. **Implement Role-Based Access Control (RBAC)**
   - Middleware to check user roles
   - Protected routes for different user types

6. **Add Audit Logging**
   - Log all admin actions
   - Track data changes

7. **Implement Two-Factor Authentication (2FA)**
   - SMS or email-based verification
   - Additional security layer

---

## Support

For issues or questions about the authentication system:
1. Check the error messages in browser console
2. Verify Supabase connection and tables
3. Ensure all API endpoints are accessible
4. Contact: energylogicsltd@gmail.com
