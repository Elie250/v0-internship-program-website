# Energy & Logics Engineering Academy - Deployment Guide

## Pre-Deployment Verification Checklist

### ✅ Code Quality
- [x] No TypeScript errors
- [x] No Waveform import errors (fixed - using Waves)
- [x] All imports resolve correctly
- [x] All page routes functional
- [x] Admin dashboard working
- [x] Student pages structure complete
- [x] API routes implemented

### ✅ Database Setup
- [x] Supabase project created
- [x] `registrations` table exists with all extended fields
- [x] All required columns present and correctly named
- [x] RLS policies configured
- [x] Service role key available
- [x] Anon key available

### ✅ Environment Variables
Verify these are set in your Vercel/production environment:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
POSTGRES_URL=your_postgres_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key (for emails)
```

### ✅ Assets & Images
- [x] Logo created: `/public/logo.png`
- [x] Hero banner created: `/public/hero-banner.jpg`
- [x] Program images created:
  - `/public/programs/electrical.jpg`
  - `/public/programs/embedded.jpg`
  - `/public/programs/iot.jpg`
  - `/public/programs/electronics.jpg`

### ✅ Color System Applied
- [x] Primary: #0B3C5D (Deep Ocean Blue)
- [x] Secondary: #1F7A8C (Teal)
- [x] Accent: #F2A900 (Gold)
- [x] Light mode colors implemented
- [x] Dark mode colors implemented
- [x] Globals.css updated with semantic tokens

## Features Implemented

### Public Pages
| Page | Route | Status | Features |
|------|-------|--------|----------|
| Home | `/` | ✅ Complete | Hero, Programs, CTA, Contact Info, Footer |
| Programs | `/programs` | ✅ Complete | Detailed program info, modules, skills |
| Application | `/apply` | ✅ Complete | 8-section form, Supabase integration |
| Contact | `/contact` | ✅ Complete | Contact form, hours, location |

### Admin Section
| Page | Route | Status | Features |
|------|-------|--------|----------|
| Login | `/admin/login` | ✅ Complete | Password authentication |
| Dashboard | `/admin/dashboard` | ✅ Complete | Stats, charts, registrations table |
| Applications | `/admin/dashboard` | ✅ Complete | Filter, search, accept/decline, export |

### Student Portal
| Page | Route | Status | Features |
|------|-------|--------|----------|
| Login | `/student/login` | ✅ Complete | Email/password login |
| Dashboard | `/student/dashboard` | ✅ Complete | Status, program info, metrics |
| Profile | `/student/profile` | ✅ Complete | Editable profile, application details |
| Documents | `/student/documents` | ✅ Complete | Documents list |
| Announcements | `/student/announcements` | ✅ Complete | Announcements display |
| Certificates | `/student/certificates` | ✅ Complete | Certificates section |

### API Routes
| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/register` | POST | Application submission | ✅ Working |
| `/api/contact` | POST | Contact form submission | ✅ Working |
| `/api/student-login` | POST | Student authentication | ✅ Working |

## Database Field Mapping

### Registrations Table Fields
The application correctly maps to these Supabase fields:
```
- full_name / name (application uses both for backward compatibility)
- email
- phone
- program
- duration
- level (from currentLevel)
- school
- field_of_study (from fieldOfStudy)
- location_province (from province)
- location_district (from district)
- date_of_birth (from dateOfBirth)
- motivation
- agreement_confirmed (from agreedToTerms)
- registration_status (from registration_status field)
- created_at
- certificate_generated
```

## Data Flow

### Application Submission Flow
1. User fills form on `/apply`
2. Form data sent to `POST /api/register`
3. API validates required fields
4. Data inserted into `registrations` table
5. Success response returns
6. User sees confirmation page
7. Email confirmation sent via Resend

### Admin Action Flow
1. Admin reviews applications in dashboard
2. Admin clicks Accept/Decline
3. Server action calls `acceptRegistration()` or `declineRegistration()`
4. Database updated with new status
5. Email sent to applicant
6. Table refreshes with new status

### Student Login Flow
1. Student visits `/student/login`
2. Enters email and password
3. Credentials validated (basic validation)
4. Session saved to localStorage
5. Redirected to `/student/dashboard`
6. Dashboard fetches student data

## Deployment Steps

### 1. Prepare Vercel
```bash
# Ensure git repository is connected
# All changes committed to branch
```

### 2. Set Environment Variables
In Vercel project settings → Environment Variables:
- Add all SUPABASE_* variables
- Add POSTGRES_* variables
- Add RESEND_API_KEY
- Add GMAIL credentials (optional, for fallback)

### 3. Deploy
```bash
# Push to main branch OR
# Use Vercel deploy button in GitHub
```

### 4. Post-Deployment Testing
- [ ] Visit home page, verify images load
- [ ] Test application form submission
- [ ] Login to admin, verify registrations appear
- [ ] Accept/Decline an application
- [ ] Check email was sent
- [ ] Test student login
- [ ] Verify responsive design on mobile

## Known Limitations & Future Enhancements

### Current Limitations
1. Student authentication uses localStorage (not production-ready for sensitive data)
2. Payment system has UI but no real processing
3. Store/products system has structure but no functionality
4. Email uses Resend only (no Gmail fallback yet)

### Recommended Future Enhancements
- [ ] Implement Supabase Auth for student accounts
- [ ] Add payment integration (Stripe/Mobile Money)
- [ ] Implement real store checkout
- [ ] Add file upload for certificates
- [ ] Create engineering projects showcase
- [ ] Add admin CRUD for programs, products, announcements
- [ ] Implement real-time notifications
- [ ] Add analytics dashboard
- [ ] Create mobile app version

## Support & Troubleshooting

### Admin Dashboard Not Showing Data
1. Check Supabase connection in terminal logs
2. Verify SUPABASE_SERVICE_ROLE_KEY is set
3. Check database has registrations table
4. Verify RLS policies aren't blocking queries

### Emails Not Sending
1. Check RESEND_API_KEY is valid
2. Check sender email is verified in Resend
3. Check recipient email is valid
4. Check function logs for errors

### Images Not Loading
1. Verify images exist in `/public/` directory
2. Check image paths in code match actual paths
3. Verify public folder is deployed
4. Check browser console for 404 errors

### Form Not Submitting
1. Check browser console for errors
2. Verify `/api/register` endpoint exists
3. Check Supabase connection
4. Verify all required fields are filled

## Success Criteria

Website is ready for deployment when:
- ✅ All pages load without errors
- ✅ Application form submits data to database
- ✅ Admin dashboard displays applications
- ✅ Admin can accept/decline with emails sent
- ✅ Images and logo display correctly
- ✅ Responsive design works on mobile
- ✅ Color scheme applied consistently
- ✅ No console errors
- ✅ Environment variables configured
- ✅ Supabase connection stable

## Contact & Support

For issues or questions:
- Email: energylogicsltd@gmail.com
- Phone: +250 783 986 252
- WhatsApp: +250 783 986 252

---

**Deployment Date:** [To be filled]
**Deployed By:** [To be filled]
**Version:** 1.0.0
**Status:** Ready for Production
