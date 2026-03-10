# Admin Dashboard - Quick Reference Card

## Dashboard URL
```
/admin/dashboard
```

## Key Features at a Glance

### Statistics Dashboard
- **6 Stat Cards** showing real-time metrics
- Color-coded for quick recognition
- Hover effects for interactivity

### Analytics Section
- **4 Interactive Charts** using Recharts
- Program distribution pie chart
- Status overview bar chart
- Timeline trend line chart
- Registration type pie chart

### Application Management Table
- **Search & Filter**: Name, email, status, type
- **Sort Options**: Date, name, program
- **Quick Actions**: Accept/Decline buttons
- **Color Badges**: Status visualization

### Export & Reports
- **CSV Export**: Compatible with Excel
- **Statistics Export**: Quick summary
- **PDF Report**: Professional printable format

---

## Quick Actions

### Accept an Application
```
1. Find applicant in table
2. Click "Accept" button
3. Email sent automatically
4. Status changes to "Accepted"
5. Certificate marked as generated
```

### Reject an Application
```
1. Find applicant in table
2. Click "Decline" button
3. Email sent automatically
4. Status changes to "Declined"
```

### Search for Applicant
```
1. Click search box at top of table
2. Type name or email
3. Results filter in real-time
4. Case-insensitive matching
```

### Filter Applications
```
By Status:
- Click "Status" dropdown
- Select: All, Pending, Accepted, Declined

By Type:
- Click "Type" dropdown
- Select: All, Students, Individuals

By Sort:
- Click "Sort By" dropdown
- Select: Date, Name, Program
```

### Download Report
```
CSV Format:
1. Click "Download CSV"
2. Open in Excel/Sheets
3. Analyze and edit

Statistics:
1. Click "Download Stats"
2. Quick summary sheet
3. Great for presentations

PDF Format:
1. Click "Print as PDF"
2. Print dialog opens
3. Save as PDF or print
4. Professional formatting
```

---

## Email Templates

### Acceptance Email (Auto-Sent)
**Subject**: Congratulations! Your Application Has Been Accepted

**Content**:
- Congratulation message
- Program name confirmation
- Next steps
- Contact information

### Decline Email (Auto-Sent)
**Subject**: Application Status Update

**Content**:
- Thank you for applying
- Decision notification
- Encouragement message
- Suggestions for future

---

## Data Fields Reference

### Personal Information
- `full_name` - Applicant's full name
- `email` - Contact email address
- `phone` - Contact phone number
- `registration_type` - Student or Individual

### Program Information
- `program` - Program name
- `training_program` - Alternative program field
- `level` - Course level (if applicable)
- `duration` - Program duration

### Institution/Profession
- `school` - School name (for students)
- `profession` - Professional field (for individuals)

### Status Information
- `status` - pending, accepted, or declined
- `certificate_generated` - Boolean flag
- `created_at` - Application submission date
- `updated_at` - Last update date

### Additional
- `message` - Additional information/message
- `schedule` - Schedule preference (if applicable)

---

## Color Coding System

### Status Badges
| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 Green | Accepted | Application approved |
| 🔴 Red | Declined | Application rejected |
| 🟡 Yellow | Pending | Awaiting decision |

### Stat Cards
| Color | Metric | Icon |
|-------|--------|------|
| 🔵 Blue | Total Apps | Users |
| 🟢 Green | Accepted | Checkmark |
| 🔴 Red | Declined | X-circle |
| 🟡 Yellow | Pending | Clock |
| 🟣 Indigo | Students | Users |
| 🟣 Purple | Individuals | Users |

---

## Common Use Cases

### Morning Check
```
1. Open dashboard
2. Review stat cards
3. Check pending count
4. Filter by pending status
5. Review applications
```

### Processing Batch
```
1. Filter by status (pending)
2. Review each application
3. Click Accept or Decline
4. Emails sent automatically
5. Status updates in real-time
```

### Monthly Reporting
```
1. Click "Print as PDF"
2. Save the report
3. Send to stakeholders
4. Archive for records
5. Analyze trends
```

### Data Analysis
```
1. Click "Download CSV"
2. Open in Excel
3. Create pivot tables
4. Generate charts
5. Analyze patterns
```

---

## Performance Stats

### Response Times
- Dashboard Load: < 2 seconds
- Filter/Search: < 500ms
- Email Sending: Async (doesn't block UI)
- Chart Rendering: < 1 second

### Data Limits
- Maximum table rows: 1000+ (with pagination)
- Export CSV: No limit
- PDF generation: Real-time in browser
- Chart data: Last 14 days

---

## Keyboard Tips

### Browser Shortcuts
- `Ctrl+F` or `Cmd+F` - Find text on page
- `Ctrl+P` or `Cmd+P` - Print/Save as PDF
- `Tab` - Navigate between elements
- `Enter` - Activate buttons/links

---

## Troubleshooting Quick Fixes

### Issue | Solution
---|---
Page blank | Refresh: Ctrl+R
Charts not loading | Clear cache: Ctrl+Shift+Delete
Buttons not responding | Reload page
Email not received | Check spam folder
Export file blank | Verify data exists in filter
Search not working | Check spelling

---

## API Endpoints (Backend)

### User Actions
- `acceptRegistration(id)` - Accept application
- `declineRegistration(id)` - Decline application
- `batchAcceptRegistrations(ids)` - Accept multiple
- `batchDeclineRegistrations(ids)` - Decline multiple

### Data Operations
- `sendApplicationEmail(params)` - Send email notification
- `generateCertificate(data)` - Generate certificate
- `generatePDFReport(data)` - Create PDF report
- `generateCSVContent(data)` - Export as CSV

---

## Files & Locations

### Main Files
- Dashboard Page: `/app/admin/dashboard/page.tsx`
- Table Component: `/app/admin/dashboard/table.tsx`
- Actions: `/app/admin/dashboard/actions.ts`
- Batch Actions: `/app/admin/dashboard/batch-actions.ts`

### Utilities
- Email: `/lib/email.ts`
- Certificates: `/lib/certificate-generator.ts`
- PDF Export: `/lib/pdf-export.ts`
- CSV Export: `/lib/excel-export.ts`

### Components
- Stats Cards: `/components/dashboard/stats-cards.tsx`
- Analytics: `/components/dashboard/analytics-section.tsx`
- Program Chart: `/components/dashboard/program-chart.tsx`
- Status Chart: `/components/dashboard/status-distribution.tsx`
- Timeline Chart: `/components/dashboard/timeline-chart.tsx`
- Type Chart: `/components/dashboard/registration-type-chart.tsx`
- Detail Modal: `/components/dashboard/application-detail-modal.tsx`

---

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full Support |
| Firefox | 88+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 90+ | ✅ Full Support |
| Mobile Chrome | Latest | ✅ Responsive |
| Mobile Safari | Latest | ✅ Responsive |

---

## Important Reminders

⚠️ **Always confirm before bulk operations**
✅ **Emails are sent immediately on accept/decline**
📧 **Applicants must have valid email addresses**
🔐 **Admin access is secure and logged**
💾 **Data backups are automatic**
📊 **Analytics update in real-time**
⏰ **Dashboard caches for 1 hour**

---

## Support Resources

- **Full Guide**: `DASHBOARD_USAGE_GUIDE.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Issues**: Contact admin team
- **Feedback**: Use support portal

---

**Quick Reference Card v1.0**
**Last Updated: March 2024**
