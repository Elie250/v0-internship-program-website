# Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENERGY & LOGICS DASHBOARD                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND LAYER (Client)                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │               Dashboard Page (app/admin/dashboard/page.tsx)      │    │
│  │                                                                   │    │
│  │  ┌──────────────────┐    ┌──────────────────┐                 │    │
│  │  │ Stats Cards      │    │ Analytics Section│                 │    │
│  │  │ - Total Apps     │    │ - Program Chart  │                 │    │
│  │  │ - Accepted       │    │ - Status Chart   │                 │    │
│  │  │ - Declined       │    │ - Timeline Chart │                 │    │
│  │  │ - Pending        │    │ - Type Chart     │                 │    │
│  │  │ - Students       │    │                  │                 │    │
│  │  │ - Individuals    │    │                  │                 │    │
│  │  └──────────────────┘    └──────────────────┘                 │    │
│  │                                                                   │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │          Dashboard Table (table.tsx)                       │ │    │
│  │  │                                                             │ │    │
│  │  │  ┌──────────┐ ┌────────┐ ┌──────┐ ┌──────┐              │ │    │
│  │  │  │ Search   │ │ Status │ │ Type │ │ Sort │              │ │    │
│  │  │  │          │ │ Filter │ │Filter│ │      │              │ │    │
│  │  │  └──────────┘ └────────┘ └──────┘ └──────┘              │ │    │
│  │  │                                                             │ │    │
│  │  │  ┌──────────────────────────────────────────────────────┐ │ │    │
│  │  │  │            Application Table                         │ │ │    │
│  │  │  │ Name │ Email │ Type │ Program │ Status │ Date │ ...│ │ │    │
│  │  │  │      │       │      │         │        │      │    │ │ │    │
│  │  │  │ Accept │ Decline Buttons                             │ │ │    │
│  │  │  └──────────────────────────────────────────────────────┘ │ │    │
│  │  │                                                             │ │    │
│  │  │  ┌──────────────┐ ┌───────────┐ ┌──────────────┐         │ │    │
│  │  │  │ Download CSV │ │ Stats PDF │ │ Print Report │         │ │    │
│  │  │  └──────────────┘ └───────────┘ └──────────────┘         │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      SERVER LAYER (Next.js Server Actions)                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────┐   ┌─────────────────────────────┐  │
│  │   Dashboard Actions             │   │   Batch Actions             │  │
│  │   (actions.ts)                  │   │   (batch-actions.ts)        │  │
│  │                                 │   │                             │  │
│  │  • acceptRegistration()         │   │  • batchAccept()            │  │
│  │  • declineRegistration()        │   │  • batchDecline()           │  │
│  │    - Update status              │   │  • bulkSendEmails()         │  │
│  │    - Generate certificate       │   │  • trackProgress()          │  │
│  │    - Send email                 │   │                             │  │
│  │    - Handle errors              │   │                             │  │
│  │                                 │   │                             │  │
│  └────────────────────────────────┘   └─────────────────────────────┘  │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                        UTILITIES LAYER (lib/)                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌──────────────┐   │
│  │  Email Service      │  │  Certificate Service │  │  Export Srv  │   │
│  │  (email.ts)         │  │  (certificate-gen.ts)│  │              │   │
│  │                     │  │                      │  │ ┌──────────┐ │   │
│  │ • sendAcceptance()  │  │ • generateID()       │  │ │ PDF      │ │   │
│  │ • sendDecline()     │  │ • createCertificate()│  │ │ Export   │ │   │
│  │ • htmlTemplates()   │  │ • trackGeneration()  │  │ └──────────┘ │   │
│  │ • errorHandling()   │  │ • validateData()     │  │              │   │
│  │                     │  │                      │  │ ┌──────────┐ │   │
│  │ Uses: Resend API    │  │ Uses: Supabase       │  │ │ CSV      │ │   │
│  │                     │  │                      │  │ │ Export   │ │   │
│  │                     │  │                      │  │ └──────────┘ │   │
│  └─────────────────────┘  └──────────────────────┘  │              │   │
│                                                      │ (excel-export)│   │
│                                                      │              │   │
│                                                      │ (pdf-export) │   │
│                                                      └──────────────┘   │
│                                                                            │
│  ┌─────────────────────┐                                                │
│  │  Supabase Admin     │                                                │
│  │  (supabaseAdmin.ts) │                                                │
│  │                     │                                                │
│  │ • Initialize client │                                                │
│  │ • Auth setup        │                                                │
│  │ • Service role key  │                                                │
│  │                     │                                                │
│  │ Uses: Supabase JS   │                                                │
│  └─────────────────────┘                                                │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────┐      ┌──────────────────────────┐         │
│  │    Supabase Database     │      │     Resend API           │         │
│  │    (PostgreSQL)          │      │     (Email Service)      │         │
│  │                          │      │                          │         │
│  │  Table: registrations    │      │ • Send acceptance email  │         │
│  │  - id (UUID)             │      │ • Send decline email     │         │
│  │  - full_name             │      │ • Error handling         │         │
│  │  - email                 │      │ • Delivery tracking      │         │
│  │  - phone                 │      │                          │         │
│  │  - registration_type     │      │ Auth: API Key            │         │
│  │  - program               │      │                          │         │
│  │  - status                │      │ Domain: energyandlogics  │         │
│  │  - certificate_id        │      │                          │         │
│  │  - certificate_generated │      │                          │         │
│  │  - created_at            │      │                          │         │
│  │  - updated_at            │      │                          │         │
│  │                          │      │                          │         │
│  │  Indexes:                │      │                          │         │
│  │  • email (unique)        │      │                          │         │
│  │  • status                │      │                          │         │
│  │  • created_at            │      │                          │         │
│  │                          │      │                          │         │
│  │  Auth: Service Role Key  │      │                          │         │
│  │                          │      │                          │         │
│  └──────────────────────────┘      └──────────────────────────┘         │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Accept Application Flow

```
User clicks "Accept" button
        ↓
handleAccept(registrationId) triggered
        ↓
acceptRegistration(id) server action called
        ↓
Fetch registration details from database
        ↓
Check if registration exists
        ↓
Update status to "accepted" in database
        ↓
Mark certificate_generated = true
        ↓
Send acceptance email via Resend API
        ↓
Compose HTML email with applicant name & program
        ↓
Resend API sends email to applicant
        ↓
Return success/error response
        ↓
UI updates status badge
        ↓
Table re-renders with new status
```

### 2. Search & Filter Flow

```
User enters search text / selects filter
        ↓
Input event listener triggers
        ↓
setState updates search/filter state
        ↓
useEffect calculates filtered array
        ↓
Apply search filter:
  - Match against full_name
  - Match against email
        ↓
Apply status filter:
  - Filter by pending/accepted/declined
        ↓
Apply type filter:
  - Filter by Student/Individual
        ↓
Apply sort:
  - Sort by date/name/program
        ↓
Display filtered & sorted results
        ↓
Update pagination info
```

### 3. Report Export Flow

```
User clicks "Download CSV" / "Print as PDF"
        ↓
Current filtered data prepared
        ↓
CSV Format:
  - Create headers
  - Create rows from data
  - Escape special characters
  - Combine into CSV string
  - Create blob
  - Trigger download
        ↓
PDF Format:
  - Generate HTML report
  - Include statistics section
  - Include detailed table
  - Add styling for print
  - Open in new window
  - User can print/save
        ↓
File downloaded / window opens
```

---

## Component Hierarchy

```
Dashboard (page.tsx)
├── Header
├── StatsCards
│   ├── StatCard (Total)
│   ├── StatCard (Accepted)
│   ├── StatCard (Declined)
│   ├── StatCard (Pending)
│   ├── StatCard (Students)
│   └── StatCard (Individuals)
├── AnalyticsSection
│   ├── ProgramChart
│   ├── StatusDistribution
│   ├── TimelineChart
│   └── RegistrationTypeChart
└── DashboardTable
    ├── SearchInput
    ├── StatusFilter
    ├── TypeFilter
    ├── SortDropdown
    ├── ExportButtons
    │   ├── Download CSV
    │   ├── Download Stats
    │   └── Print PDF
    └── ApplicationTable
        ├── TableHeader
        └── TableRow (repeating)
            ├── Name
            ├── Email
            ├── Type
            ├── Program
            ├── Status Badge
            ├── Date
            ├── Accept Button
            └── Decline Button
```

---

## Module Dependencies

```
App Layer
  └── app/admin/dashboard/page.tsx
       ├── imports: lib/supabaseAdmin
       ├── imports: components/dashboard/stats-cards
       ├── imports: components/dashboard/analytics-section
       └── imports: ./table

Components Layer
  ├── components/dashboard/stats-cards.tsx
  │   └── lucide-react (icons)
  │
  ├── components/dashboard/analytics-section.tsx
  │   ├── ./program-chart
  │   ├── ./status-distribution
  │   ├── ./timeline-chart
  │   └── ./registration-type-chart
  │
  ├── components/dashboard/program-chart.tsx
  │   └── recharts (PieChart)
  │
  ├── components/dashboard/status-distribution.tsx
  │   └── recharts (BarChart)
  │
  ├── components/dashboard/timeline-chart.tsx
  │   └── recharts (LineChart)
  │
  ├── components/dashboard/registration-type-chart.tsx
  │   └── recharts (PieChart)
  │
  └── components/dashboard/application-detail-modal.tsx
      └── lucide-react (icons)

Table Layer
  └── app/admin/dashboard/table.tsx
       ├── ./actions (acceptRegistration, declineRegistration)
       ├── lib/excel-export (downloadExcel, downloadStatisticsSheet)
       ├── lib/pdf-export (downloadPDFReport)
       └── lucide-react (icons)

Actions Layer
  ├── app/admin/dashboard/actions.ts
  │   ├── lib/supabaseAdmin
  │   ├── lib/email (sendApplicationEmail)
  │   └── lib/certificate-generator
  │
  └── app/admin/dashboard/batch-actions.ts
       ├── lib/supabaseAdmin
       ├── lib/email
       └── error handling

Utilities Layer
  ├── lib/supabaseAdmin.ts
  │   └── @supabase/supabase-js
  │
  ├── lib/email.ts
  │   └── resend (Resend API)
  │
  ├── lib/certificate-generator.ts
  │   └── (no external dependencies)
  │
  ├── lib/pdf-export.ts
  │   └── (browser native APIs)
  │
  └── lib/excel-export.ts
       └── (browser native APIs)
```

---

## Authentication Flow

```
User visits /admin/dashboard
        ↓
Middleware checks authentication
        ↓
If not authenticated:
  - Redirect to /admin/login
        ↓
If authenticated:
  - Load dashboard
  - Fetch registrations from Supabase
  - Display data
        ↓
Admin credentials validated in:
  - lib/supabaseAdmin (service role)
  - app/actions/auth (login flow)
```

---

## Error Handling Strategy

```
Accept/Decline Application
  ├── Try
  │   ├── Fetch registration
  │   │   └── Error: Log & return error message
  │   ├── Update status
  │   │   └── Error: Log & return error message
  │   └── Send email
  │       └── Error: Status updated but email failed message
  └── Catch
      └── Generic error handling

Export Functions
  ├── CSV: Browser blob generation
  │   └── Error: Log to console
  ├── PDF: Window.open & HTML
  │   └── Error: Silent fail (user opens console)
  └── Stats: Browser blob generation
      └── Error: Log to console

Search/Filter
  └── Real-time filtering
      └── No errors (client-side operation)

API Calls
  ├── Timeout: Default behavior
  ├── 404: Registration not found
  ├── 500: Server error
  └── Network: Connection error
```

---

## State Management

```
Dashboard (Server Component)
  └── Loads data once from Supabase
      └── Passes to child components

Table (Client Component)
  ├── useState: search
  ├── useState: statusFilter
  ├── useState: typeFilter
  ├── useState: sortBy
  ├── useState: loadingId
  └── All state local to component
      └── Filtering computed on-the-fly

Charts (Client Components)
  ├── Props: registrations array
  ├── Calculated on-the-fly
  └── No internal state

Stats Cards (Client Component)
  ├── Props: count values
  ├── Render only
  └── No state
```

---

## Performance Optimization

```
Code Splitting:
  ├── Each chart component lazy loaded
  ├── Table component separate
  └── Modal component on-demand

Rendering:
  ├── Server-side: Dashboard data fetching
  ├── Client-side: User interactions
  └── No unnecessary re-renders

Data Fetching:
  ├── Single query to Supabase
  ├── Filter on client (small dataset)
  └── No pagination (for now)

Caching:
  ├── Revalidate: 3600 seconds (1 hour)
  ├── Next.js automatic caching
  └── User can refresh manually

Charts:
  ├── Calculated once on mount
  ├── Memoized if needed
  └── Recharts optimizes rendering
```

---

## Security Architecture

```
Authentication:
  ├── Supabase Auth (user signup/login)
  ├── Session management
  └── Middleware protection

Authorization:
  ├── Admin-only routes protected
  ├── Service role key for sensitive operations
  └── No role-based access (for v1)

Data Protection:
  ├── Parameterized queries (Supabase)
  ├── Email validation
  ├── XSS protection (React escaping)
  └── CSRF protection (Next.js)

API Security:
  ├── Resend API key secured in env
  ├── Service role key never exposed
  ├── No API keys in client code
  └── Server actions for sensitive operations

Environment:
  ├── HTTPS enforced in production
  ├── Environment variables protected
  └── No secrets in code
```

---

## Deployment Architecture

```
Local Development
  ├── npm run dev
  ├── http://localhost:3000
  └── .env.local file

GitHub Repository
  ├── Push to main branch
  ├── GitHub Actions (optional)
  └── Version control

Vercel Production
  ├── Auto-deploy on push to main
  ├── Environment variables configured
  ├── Edge functions (optional)
  └── Analytics & monitoring

Database (Supabase)
  ├── PostgreSQL hosted
  ├── Backups automatic
  ├── SSL/TLS encryption
  └── Real-time capabilities (optional)

Email Service (Resend)
  ├── SMTP endpoints
  ├── Delivery tracking
  ├── Domain verification
  └── Analytics dashboard
```

---

## Summary

The architecture is **modular**, **scalable**, and **maintainable**:

- **Frontend**: React components with Tailwind CSS
- **Charts**: Recharts for data visualization
- **Backend**: Next.js Server Actions
- **Database**: Supabase PostgreSQL
- **Email**: Resend API
- **Deployment**: Vercel

All components are **loosely coupled** and can be **independently modified** without affecting others.

---

*Last Updated: January 2026*  
*Energy & Logics Admin Dashboard v1.0.0*
