# Energy & Logics Engineering Academy Platform

Professional internship program management platform built with Next.js, React, and Supabase.

## 🎯 Overview

Energy & Logics Engineering Academy is a comprehensive platform for managing engineering internship programs. The application provides:

- **Public-Facing Website** - Home, programs showcase, application portal, contact page
- **Admin Dashboard** - Application management, registrations tracking, analytics, exports
- **Student Portal** - Dashboard, profile management, announcements, certificates
- **Supabase Integration** - Real-time database, authentication, data persistence
- **Professional Design** - Modern UI with academy brand colors (Blue, Teal, Gold)

## 🚀 Quick Start

### Installation

```bash
# Clone and install
git clone <repository>
cd v0-internship-program-website
npm install
# or pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
POSTGRES_URL=your_postgres_url
RESEND_API_KEY=your_resend_key
```

### Run Development Server

```bash
npm run dev
# or pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
app/
├── page.tsx                 # Home page
├── apply/page.tsx          # Application form
├── programs/page.tsx       # Programs listing
├── contact/page.tsx        # Contact page
├── admin/
│   ├── login/page.tsx      # Admin login
│   ├── dashboard/page.tsx  # Admin dashboard
│   └── layout.tsx          # Admin layout
├── student/
│   ├── login/page.tsx      # Student login
│   ├── dashboard/page.tsx  # Student dashboard
│   ├── profile/page.tsx    # Student profile
│   └── announcements/page.tsx
├── api/
│   ├── register/route.ts   # Application submission
│   ├── contact/route.ts    # Contact form
│   └── student-login/route.ts
└── layout.tsx              # Root layout

components/
├── ui/                     # shadcn/ui components
├── dashboard/              # Dashboard components
│   ├── stats-cards.tsx
│   ├── analytics-section.tsx
│   ├── charts/
│   └── tables/

lib/
├── supabaseAdmin.ts        # Supabase client
├── email.ts                # Email sending
├── excel-export.ts         # CSV/Excel export
└── pdf-export.ts           # PDF report generation

public/
├── logo.png                # Academy logo
├── hero-banner.jpg         # Hero image
└── programs/               # Program images
```

## 🎨 Design System

**Color Palette:**
- Primary: `#0B3C5D` (Deep Ocean Blue)
- Secondary: `#1F7A8C` (Teal)
- Accent: `#F2A900` (Gold)
- Backgrounds: White, Light Gray

**Typography:**
- Headings: Bold, 18-56px
- Body: Regular, 14-16px
- Font: System fonts (Geist)

**Components:**
- Built with shadcn/ui
- Responsive with Tailwind CSS
- Dark mode support

## 📊 Database Schema

### Registrations Table
Main table for student applications with fields:
- Personal: `full_name`, `email`, `phone`, `date_of_birth`, `gender`
- Academic: `school`, `level`, `field_of_study`, `year_of_study`
- Program: `program`, `duration`, `preferred_duration`
- Location: `location_province`, `location_district`, `location_sector`
- Sponsorship: `sponsorship_type`, `sponsor_name`, `sponsor_phone`, `sponsor_email`
- Guardian: `parent_guardian_name`, `parent_guardian_phone`, `parent_guardian_email`
- Status: `registration_status`, `agreement_confirmed`, `certificate_generated`

## 🔐 Authentication

### Admin Login
- Path: `/admin/login`
- Password-based authentication
- Session stored server-side

### Student Login
- Path: `/student/login`
- Email/password validation
- Session stored in localStorage

## 📧 Email System

- **Provider:** Resend (primary)
- **Fallback:** Gmail (configured)
- **Templates:** HTML-based for acceptance/rejection

## 📱 Pages

### Public Pages
| Page | Route | Features |
|------|-------|----------|
| Home | `/` | Hero, programs, CTA, footer |
| Programs | `/programs` | Detailed program info |
| Apply | `/apply` | 8-section form, validation |
| Contact | `/contact` | Contact form, location |

### Admin Pages
| Page | Route | Features |
|------|-------|----------|
| Login | `/admin/login` | Secure authentication |
| Dashboard | `/admin/dashboard` | Stats, charts, applications |

### Student Pages
| Page | Route | Features |
|------|-------|----------|
| Login | `/student/login` | Email/password login |
| Dashboard | `/student/dashboard` | Status, program info |
| Profile | `/student/profile` | Editable profile |

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Email:** Resend
- **Charts:** Recharts
- **Icons:** Lucide React

## 📝 Documentation

- `IMPLEMENTATION_CHECKLIST.md` - Complete feature checklist
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Connect GitHub repository
# Set environment variables in Vercel
# Automatic deployments on push
```

## 📞 Support

- Email: energylogicsltd@gmail.com
- Phone: +250 783 986 252
- WhatsApp: +250 783 986 252

## 📄 License

Proprietary - Energy & Logics Ltd

## Continue with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting:

[Continue working on v0 →](https://v0.app/chat/projects/prj_Zd1YJvzQOqYyw0gjH0AIoZlnV6a1)

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** March 2025
