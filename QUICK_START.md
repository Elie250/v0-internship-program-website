# Energy & Logics Academy - Quick Start Guide

## 🚀 Start Development

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

## 🔑 Key Routes

### Public Pages
- **Home** → `/`
- **Programs** → `/programs`
- **Apply** → `/apply`
- **Contact** → `/contact`

### Admin Area
- **Login** → `/admin/login`
- **Dashboard** → `/admin/dashboard`
- Default Credentials: Set in database

### Student Area
- **Login** → `/student/login`
- **Dashboard** → `/student/dashboard`
- **Profile** → `/student/profile`

## 💾 Environment Setup

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
POSTGRES_URL=your_postgres_url
RESEND_API_KEY=your_resend_key
```

## 📂 Important Files

| File | Purpose |
|------|---------|
| `/app/page.tsx` | Home page |
| `/app/apply/page.tsx` | Application form |
| `/app/admin/dashboard/page.tsx` | Admin dashboard |
| `/lib/supabaseAdmin.ts` | Supabase client |
| `/app/api/register/route.ts` | Form submission API |
| `/app/globals.css` | Design system |

## 🎨 Colors Used

```css
Primary: #0B3C5D (Deep Blue)
Secondary: #1F7A8C (Teal)
Accent: #F2A900 (Gold)
```

## 🧪 Test Features

1. **Home Page** - Check hero loads correctly
2. **Application Form** - Submit test data
3. **Admin Login** - View submissions
4. **Accept/Decline** - Check email sends

## 🚢 Deploy to Vercel

```bash
# 1. Connect GitHub repo
# 2. Add environment variables in Vercel
# 3. Push to main branch
# Automatic deployment ✅
```

## 📊 Database Tables

Main table: `registrations`
- 35+ fields for complete student profiles
- RLS policies configured
- Auto timestamps

## 🆘 Troubleshooting

### Form Not Submitting?
- Check browser console
- Verify `/api/register` exists
- Check Supabase connection

### Admin Empty?
- Verify SUPABASE_SERVICE_ROLE_KEY
- Check RLS policies
- Ensure `registrations` table exists

### Images Not Loading?
- Check `/public/` directory
- Verify image paths in code
- Clear browser cache

## 📞 Team Contact

- **Email:** energylogicsltd@gmail.com
- **Phone:** +250 783 986 252
- **WhatsApp:** +250 783 986 252

## 📚 Documentation

- `README.md` - Full overview
- `IMPLEMENTATION_CHECKLIST.md` - Feature status
- `DEPLOYMENT_GUIDE.md` - Deployment help
- `FINAL_SUMMARY.md` - Project summary

## ✅ Pre-Deployment Checklist

- [ ] Environment variables set
- [ ] Database tables created
- [ ] Admin credentials configured
- [ ] Images in `/public/`
- [ ] No console errors
- [ ] Test application form
- [ ] Test admin dashboard
- [ ] Verify email sending

## 🎯 Key Features

✅ Professional home page with academy branding  
✅ Comprehensive 8-section application form  
✅ Admin dashboard with charts and analytics  
✅ Student portal with profile management  
✅ Email notifications on application actions  
✅ Data export to CSV and PDF  
✅ Responsive design (mobile-friendly)  
✅ Dark mode support  

---

**Ready to deploy!** Follow DEPLOYMENT_GUIDE.md for full instructions.
