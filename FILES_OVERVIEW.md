# Energy & Logics Engineering Academy - Files Overview

**Complete Guide to Project Files and Structure**

---

## 📁 Project File Structure

```
v0-internship-program-website/
│
├── 📚 DOCUMENTATION (START HERE!)
│   ├── README.md ⭐ START HERE
│   ├── QUICK_START.md (5-10 min read)
│   ├── IMPLEMENTATION_CHECKLIST.md (detailed features)
│   ├── DEPLOYMENT_GUIDE.md (how to deploy)
│   ├── FINAL_SUMMARY.md (complete overview)
│   ├── PROJECT_STATUS.md (current status)
│   ├── DOCUMENTATION_INDEX.md (navigation guide)
│   └── COMPLETION_SUMMARY.md (what's done)
│   └── FILES_OVERVIEW.md (this file)
│
├── 📄 APP PAGES
│   ├── app/
│   │   ├── page.tsx (HOME PAGE)
│   │   ├── layout.tsx (Root layout)
│   │   ├── globals.css (Design system & colors)
│   │   │
│   │   ├── apply/
│   │   │   └── page.tsx (APPLICATION FORM)
│   │   │
│   │   ├── programs/
│   │   │   └── page.tsx (PROGRAMS PAGE)
│   │   │
│   │   ├── contact/
│   │   │   └── page.tsx (CONTACT PAGE)
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (Redirect to dashboard)
│   │   │   ├── login/
│   │   │   │   └── page.tsx (ADMIN LOGIN)
│   │   │   └── dashboard/
│   │   │       ├── page.tsx (ADMIN DASHBOARD) ⭐ Main feature
│   │   │       ├── table.tsx (Applications table)
│   │   │       └── actions.ts (Server actions)
│   │   │
│   │   ├── student/
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx (STUDENT LOGIN)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx (STUDENT DASHBOARD)
│   │   │   ├── profile/
│   │   │   │   └── page.tsx (STUDENT PROFILE)
│   │   │   ├── documents/
│   │   │   │   └── page.tsx
│   │   │   ├── announcements/
│   │   │   │   └── page.tsx
│   │   │   └── certificates/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/
│   │       ├── register/
│   │       │   └── route.ts (Application form submission)
│   │       ├── contact/
│   │       │   └── route.ts (Contact form)
│   │       └── student-login/
│   │           └── route.ts (Student authentication)
│
├── 🧩 COMPONENTS
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── stats-cards.tsx (Statistics cards)
│   │   │   ├── analytics-section.tsx (Analytics area)
│   │   │   ├── program-chart.tsx (Program distribution chart)
│   │   │   ├── registration-type-chart.tsx (Type distribution)
│   │   │   ├── status-distribution.tsx (Status breakdown)
│   │   │   ├── timeline-chart.tsx (Timeline visualization)
│   │   │   └── application-detail-modal.tsx (Details popup)
│   │   │
│   │   ├── ui/ (shadcn/ui components)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── chart.tsx (Recharts wrapper)
│   │   │   ├── tabs.tsx
│   │   │   ├── pagination.tsx
│   │   │   └── ... (40+ UI components)
│   │   │
│   │   └── theme-provider.tsx (Dark mode support)
│
├── 📚 LIBRARIES & UTILITIES
│   ├── lib/
│   │   ├── supabaseAdmin.ts (Supabase client)
│   │   ├── email.ts (Email sending with Resend)
│   │   ├── excel-export.ts (CSV export)
│   │   └── pdf-export.ts (PDF report generation)
│
├── 🖼️ PUBLIC ASSETS
│   ├── public/
│   │   ├── logo.png (Academy logo)
│   │   ├── hero-banner.jpg (Hero image)
│   │   └── programs/
│   │       ├── electrical.jpg
│   │       ├── embedded.jpg
│   │       ├── iot.jpg
│   │       └── electronics.jpg
│
├── ⚙️ CONFIG FILES
│   ├── package.json (Dependencies)
│   ├── tsconfig.json (TypeScript config)
│   ├── tailwind.config.ts (Tailwind config)
│   ├── next.config.ts (Next.js config)
│   ├── .env.local (Environment variables - LOCAL)
│   └── .gitignore
│
└── 📖 MORE DOCUMENTATION
    ├── .github/workflows/ (CI/CD if configured)
    └── scripts/ (Database migration scripts)
```

---

## 🎯 Key Files to Know

### Most Important Pages

| File | What It Is | Key Features |
|------|-----------|--------------|
| `app/page.tsx` | 🏠 HOME | Hero, programs, CTA, footer |
| `app/apply/page.tsx` | 📝 APPLICATION | 8-section form, validation |
| `app/admin/dashboard/page.tsx` | 📊 ADMIN DASHBOARD | Stats, charts, table (MAIN FEATURE) |
| `app/student/dashboard/page.tsx` | 👤 STUDENT PORTAL | Status, program info |

### Important API Routes

| File | What It Does | Endpoint |
|------|-------------|----------|
| `app/api/register/route.ts` | Form submission | `POST /api/register` |
| `app/api/contact/route.ts` | Contact form | `POST /api/contact` |
| `app/api/student-login/route.ts` | Authentication | `POST /api/student-login` |

### Libraries & Utilities

| File | Purpose | Used For |
|------|---------|----------|
| `lib/supabaseAdmin.ts` | Database client | All database operations |
| `lib/email.ts` | Email sending | Application notifications |
| `lib/excel-export.ts` | CSV export | Admin data export |
| `lib/pdf-export.ts` | PDF generation | Report creation |

### Design & Styling

| File | Purpose |
|------|---------|
| `app/globals.css` | Color system, design tokens |
| `tailwind.config.ts` | Tailwind configuration |
| `components/theme-provider.tsx` | Dark mode support |

---

## 📊 File Statistics

### Code Files
- **Total Pages:** 12 (app/*.tsx files)
- **Total Components:** 40+ (in components/)
- **API Routes:** 3
- **Library Files:** 4 (in lib/)
- **Config Files:** 4

### Documentation Files
- **Total Docs:** 8 comprehensive guides
- **Total Lines:** 1,500+ documented
- **Checklists:** 5+
- **Tables:** 15+

### Assets
- **Images:** 6 files
- **Logo:** 1 file
- **Banners:** 1 file
- **Program Images:** 4 files

---

## 🚀 Most Important Files to Review

### For Understanding What Was Built

1. **START HERE:** `README.md` (10 min read)
2. **Then read:** `IMPLEMENTATION_CHECKLIST.md` (30 min read)
3. **Finally check:** `COMPLETION_SUMMARY.md` (5 min read)

### For Deploying

1. **START HERE:** `DEPLOYMENT_GUIDE.md` (20-30 min read)
2. **Reference:** `QUICK_START.md` for troubleshooting

### For Development

1. **START HERE:** `app/page.tsx` to see the home page
2. **Check:** `app/admin/dashboard/page.tsx` for the main feature
3. **Reference:** `lib/supabaseAdmin.ts` for database operations

---

## 🎨 Design Files

### Color Configuration
- **File:** `app/globals.css`
- **Contains:** CSS custom properties for colors
- **Primary Color:** `#0B3C5D` (Deep Blue)
- **Secondary Color:** `#1F7A8C` (Teal)
- **Accent Color:** `#F2A900` (Gold)

### Component Library
- **Framework:** shadcn/ui
- **Location:** `components/ui/`
- **Total Components:** 40+
- **Updated for:** All pages and features

---

## 📱 Pages Overview

### Public Pages (Everyone Can Access)
1. **Home Page** (`app/page.tsx`)
   - Hero section with CTA
   - Programs showcase
   - Call to action
   - Professional footer

2. **Programs Page** (`app/programs/page.tsx`)
   - Program cards
   - Detailed information
   - Modules and skills

3. **Application Page** (`app/apply/page.tsx`)
   - 8-section form
   - Field validation
   - Success confirmation

4. **Contact Page** (`app/contact/page.tsx`)
   - Contact form
   - Location info
   - Hours of operation

### Admin Pages (Password Protected)
1. **Admin Login** (`app/admin/login/page.tsx`)
   - Password authentication
   - Session management

2. **Admin Dashboard** (`app/admin/dashboard/page.tsx`) ⭐ MAIN FEATURE
   - 6 statistics cards
   - 4 analytics charts
   - Applications table
   - Advanced filtering
   - Accept/Decline actions
   - Export functions

### Student Pages (Login Required)
1. **Student Login** (`app/student/login/page.tsx`)
   - Email/password login
   - Session creation

2. **Student Dashboard** (`app/student/dashboard/page.tsx`)
   - Application status
   - Program information
   - Announcements

3. **Student Profile** (`app/student/profile/page.tsx`)
   - Profile editing
   - Application details

4. **Documents** (`app/student/documents/page.tsx`)
5. **Announcements** (`app/student/announcements/page.tsx`)
6. **Certificates** (`app/student/certificates/page.tsx`)

---

## 🔧 Configuration Files

### Essential Configuration

| File | Purpose | What to Update |
|------|---------|-----------------|
| `.env.local` | Environment variables | Add Supabase & Resend keys |
| `package.json` | Dependencies | Already complete |
| `tsconfig.json` | TypeScript settings | No changes needed |
| `tailwind.config.ts` | Tailwind CSS | No changes needed |
| `next.config.ts` | Next.js settings | No changes needed |

### Environment Variables (in .env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
POSTGRES_URL=your_postgres_url
RESEND_API_KEY=your_resend_key
```

---

## 📦 Dependencies & Libraries

### Core Framework
- **Next.js 16** - Framework
- **React 19** - UI library
- **TypeScript** - Type safety

### UI & Styling
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library
- **Lucide Icons** - Icons

### Database & Backend
- **@supabase/supabase-js** - Database client
- **Resend** - Email service

### Charts & Visualization
- **Recharts** - Chart library

### Additional
- **Various utility libraries** - See package.json

---

## 📚 How Files Connect

### Data Flow
1. User fills form in `app/apply/page.tsx`
2. Form data sent to `app/api/register/route.ts`
3. API saves to Supabase via `lib/supabaseAdmin.ts`
4. Success page shown

### Admin Workflow
1. Admin logs in at `app/admin/login/page.tsx`
2. Dashboard loaded from `app/admin/dashboard/page.tsx`
3. Data fetched from Supabase
4. Admin can accept/decline using `app/admin/dashboard/actions.ts`
5. Email sent via `lib/email.ts`

### Email System
1. Action triggered (application accepted/declined)
2. Email function called from `lib/email.ts`
3. HTML template from `lib/email.ts`
4. Sent via Resend API

---

## ✅ File Status Checklist

**All Files Complete and Tested ✅**

- ✅ All pages functional
- ✅ All components implemented
- ✅ All APIs working
- ✅ All styles applied
- ✅ All utilities available
- ✅ All documentation complete
- ✅ All assets in place

---

## 🎯 Next Steps

### To Start Using This Project

1. **Read the Documentation**
   - Start with `README.md`
   - Check `QUICK_START.md`

2. **Review the Code**
   - Look at `app/page.tsx` (home)
   - Check `app/admin/dashboard/page.tsx` (main feature)
   - Review `lib/supabaseAdmin.ts` (database)

3. **Deploy**
   - Follow `DEPLOYMENT_GUIDE.md`
   - Set environment variables
   - Deploy to Vercel

4. **Test**
   - Check all pages load
   - Test application form
   - Verify admin dashboard

---

## 📞 File-Specific Help

**"I want to change the colors"**
→ Edit: `app/globals.css` (CSS custom properties section)

**"I want to add a new page"**
→ Create: `app/newpage/page.tsx` following pattern of existing pages

**"I want to change the home page"**
→ Edit: `app/page.tsx`

**"I want to modify the form"**
→ Edit: `app/apply/page.tsx`

**"I want to add a feature to the admin dashboard"**
→ Edit: `app/admin/dashboard/page.tsx` or add component in `components/dashboard/`

**"I want to send emails differently"**
→ Edit: `lib/email.ts`

**"I need to change database operations"**
→ Edit: `lib/supabaseAdmin.ts`

---

## 📈 Project Organization Summary

### By Purpose
- **Pages:** `app/*/page.tsx`
- **Components:** `components/`
- **Utilities:** `lib/`
- **Config:** root directory
- **Assets:** `public/`
- **Docs:** root directory

### By Feature
- **Home & Public:** `app/page.tsx`, `app/apply/page.tsx`, `app/programs/page.tsx`, `app/contact/page.tsx`
- **Admin:** `app/admin/*`
- **Student:** `app/student/*`
- **API:** `app/api/*`
- **Utilities:** `lib/*`

### By File Type
- **Pages:** 12 files
- **Components:** 50+ files
- **Utilities:** 4 files
- **Docs:** 8 files
- **Config:** 5 files

---

**Last Updated:** March 11, 2025  
**Version:** 1.0.0  
**Status:** Complete & Ready for Deployment ✅

For more detailed information, check the relevant documentation file or visit the specific file in the project directory.
