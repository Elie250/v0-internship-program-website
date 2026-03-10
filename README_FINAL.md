# Energy & Logics - Internship Program Website

## 🎯 Project Overview

A professional, fully-featured website for Energy & Logics internship programs in Kigali, Rwanda. Built with Next.js 16, React 19, and modern web technologies.

## ✨ Features

### Public Website
- **Professional Homepage** with hero section and program showcase
- **Four Internship Programs**: ELT, CSA, NIT, ETE with detailed descriptions and images
- **Registration Form** supporting both students and individuals
- **Responsive Design** optimized for mobile, tablet, and desktop
- **Contact Information** with direct links to WhatsApp and email

### Admin Dashboard  
- **Authentication System** with secure login
- **Application Management** - View, accept, decline registrations
- **Real-time Statistics** - 6 key metrics with visual indicators
- **Advanced Analytics** - 4 interactive charts and visualizations
- **Export Functionality** - Download applications as CSV or PDF
- **Email Notifications** - Automatic emails for accepted/declined applications
- **Certificate Generation** - Auto-generated on approval

## 🛠 Tech Stack

- **Framework**: Next.js 16.1.6
- **React**: 19.2.4
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend API
- **Authentication**: Custom auth + Supabase
- **Charts**: Recharts
- **Language**: TypeScript
- **Deployment**: Vercel

## 📋 Requirements

- Node.js 24.x
- npm/yarn/pnpm
- Supabase account
- Resend API key (for emails)
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Elie250/v0-internship-program-website.git
cd v0-internship-program-website
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000 in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

## 📁 Project Structure

```
energy-logics-website/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── api/                  # API routes
│   │   └── register/route.ts # Registration endpoint
│   ├── admin/                # Admin section
│   │   ├── dashboard/        # Admin dashboard
│   │   ├── login/            # Login page
│   │   └── layout.tsx        # Admin layout
│   └── actions/              # Server actions
├── components/               # React components
│   ├── ui/                  # shadcn/ui components
│   └── dashboard/           # Dashboard components
├── lib/                     # Utilities and libraries
│   ├── supabaseAdmin.ts    # Supabase client
│   ├── email.ts            # Email utilities
│   └── ...
├── public/                  # Static assets
│   ├── images/             # Program images
│   ├── hero-electrical.jpg
│   └── logo.png
└── Configuration files
    ├── next.config.mjs
    ├── tsconfig.json
    ├── postcss.config.js
    └── package.json
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Connect GitHub Repository**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository

2. **Add Environment Variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env.example`

3. **Deploy**
   - Click "Deploy"
   - Vercel automatically builds and deploys

4. **Configure Custom Domain**
   - In Vercel Dashboard → Settings → Domains
   - Add your domain (e.g., energyandlogics.rw)
   - Update DNS records

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables when prompted
```

## 📊 Database Schema

### registrations table
```sql
id (uuid, primary key)
registration_type (student | individual)
full_name (text)
email (text)
phone (text)
school (text, optional)
program (text, optional)
level (text, optional)
duration (text, optional)
profession (text, optional)
training_program (text, optional)
schedule (text, optional)
message (text, optional)
status (pending | accepted | declined)
certificate_generated (boolean)
created_at (timestamp)
```

## 🔐 Security Features

- ✅ TypeScript for type safety
- ✅ Input validation on forms
- ✅ Supabase Row-Level Security (RLS)
- ✅ Environment variables for secrets
- ✅ CSRF protection via Next.js
- ✅ Secure authentication flow
- ✅ Server-side form validation

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
- Touch-friendly UI elements
- Optimized images for all devices

## ♿ Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Screen reader compatible

## 🎨 Customization

### Change Colors
Edit CSS variables in `app/globals.css`:
```css
:root {
  --primary: oklch(0.33 0.15 254);
  --secondary: oklch(0.85 0.1 40);
  /* ... more colors */
}
```

### Change Fonts
Edit `app/layout.tsx`:
```tsx
import { YourFont } from 'next/font/google'
const font = YourFont({ subsets: ['latin'] })
```

### Add New Programs
Edit `PROGRAMS` array in `app/page.tsx`

### Modify Email Templates
Edit `lib/email.ts` email template functions

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### Database Connection Error
- Verify Supabase credentials in `.env.local`
- Check database is running
- Verify table exists: `registrations`

### Emails Not Sending
- Check RESEND_API_KEY is valid
- Verify sender email is verified in Resend
- Check email is in correct format

### Images Not Loading
- Verify files exist in `/public/images/`
- Check file names are correct
- Clear browser cache (Ctrl+Shift+Del)

## 📖 Documentation

- **FINAL_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **BUILD_SUMMARY.md** - Build process summary
- **ENVIRONMENT_SETUP.md** - Environment configuration
- **.env.example** - Environment variable template

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push branch: `git push origin feature/your-feature`
4. Create Pull Request

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review GitHub Issues
3. Contact: energylogicsltd@gmail.com
4. WhatsApp: +250 783 986 252

## 📄 License

This project is proprietary. All rights reserved to Energy & Logics Ltd.

## 👥 Team

- **Development**: Energy & Logics Team
- **Design**: Professional UI/UX
- **Deployment**: Vercel Infrastructure

## 🎯 Roadmap

- [ ] Student testimonials section
- [ ] Photo gallery with program activities
- [ ] Payment integration for paid programs
- [ ] Student portal for enrolled participants
- [ ] Blog/News section
- [ ] Mobile app
- [ ] Advanced analytics dashboard
- [ ] Social media integration

## ✅ Status

**Current Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2024  
**Deployment**: Vercel  

---

**Ready to transform careers through engineering education!** 🚀
