# Admin Dashboard - Usage Guide

## Getting Started

The Admin Dashboard is a comprehensive management tool for the Energy & Logics registration and application management system. It provides real-time insights, bulk operations, and professional reporting capabilities.

## Dashboard Overview

### 1. Statistics Cards Section
Located at the top of the dashboard, showing real-time metrics:

- **Total Applications**: Overall count of all registrations
- **Accepted**: Number of approved applications
- **Declined**: Number of rejected applications
- **Pending**: Number of applications awaiting decision
- **Students**: Count of student registrations
- **Individuals**: Count of individual registrations

Each card includes an icon and hover effects for better visual feedback.

### 2. Analytics & Insights Section

#### Program Distribution Chart
- **Type**: Pie chart
- **Shows**: Application count per program
- **Use Case**: Understand which programs are most popular
- **Interaction**: Hover over slices for exact counts

#### Application Status Overview
- **Type**: Bar chart
- **Shows**: Breakdown of accepted, declined, and pending applications
- **Use Case**: Quick status summary
- **Interaction**: Visual comparison of decision distribution

#### Applications Over Time
- **Type**: Line chart
- **Shows**: Application trends over the last 14 days
- **Use Case**: Monitor application velocity
- **Interaction**: Identify peak periods and trends

#### Registration Type Distribution
- **Type**: Pie chart
- **Shows**: Student vs Individual registrations
- **Use Case**: Understand applicant demographics
- **Interaction**: See percentage breakdown

### 3. Applications Table

#### Filtering Options

**Search Bar**
- Search by applicant name or email
- Real-time filtering
- Case-insensitive

**Status Filter**
- All Statuses (default)
- Pending applications
- Accepted applications
- Declined applications

**Type Filter**
- All Types (default)
- Students
- Individuals

**Sort Options**
- Date (Newest First) - default
- Name (A-Z)
- Program

#### Table Columns

| Column | Description |
|--------|-------------|
| Name | Full name of applicant |
| Email | Contact email address |
| Type | Registration type (Student/Individual) |
| Program | Applied program name |
| Status | Current application status (Pending/Accepted/Declined) |
| Date | Application submission date |
| Actions | Accept/Decline buttons |

#### Status Badges
- **Green with Checkmark**: Accepted applications
- **Red with X**: Declined applications
- **Yellow with Clock**: Pending applications

#### Action Buttons

**Accept Button**
- Sends acceptance email to applicant
- Updates status to "Accepted"
- Disables after action
- Marks certificate_generated as true

**Decline Button**
- Sends decline email to applicant
- Updates status to "Declined"
- Disables after action

### 4. Export & Report Functions

#### Download CSV
- Exports all filtered applications to CSV format
- Includes all columns: Name, Email, Phone, Type, School/Profession, Program, Level, Duration, Status, Date
- Compatible with Excel and Google Sheets

#### Download Stats
- Exports statistics summary including:
  - Total applications count
  - Acceptance/Decline/Pending percentages
  - Student vs Individual breakdown
- Quick overview for presentations or reports

#### Print as PDF
- Generates professional PDF report
- Includes:
  - Header with title and timestamp
  - Statistics cards
  - Program distribution
  - Detailed application listing
  - Professional formatting with colors and icons
- Browser print dialog opens automatically

## Common Workflows

### Reviewing Applications

1. **Filter by Status**
   - Select "Pending" from Status filter
   - View all applications waiting for decision

2. **Sort by Program**
   - Change Sort By to "Program"
   - Review applications grouped by program

3. **Review Details**
   - Click on applicant row to view full details (future feature)
   - Review their message and qualifications

4. **Make Decision**
   - Click "Accept" or "Decline"
   - System sends email automatically
   - Status updates in real-time

### Monthly Reporting

1. **Generate Report**
   - Click "Print as PDF"
   - Browser opens print dialog
   - Save as PDF or print directly

2. **Export Data**
   - Click "Download CSV"
   - Opens Excel for analysis
   - Create pivot tables or charts

3. **Statistics Overview**
   - Click "Download Stats"
   - Get quick summary of metrics

### Searching for Specific Applicant

1. **Use Search Bar**
   - Type applicant name or email
   - Results filter in real-time
   - Case-insensitive matching

2. **View Applicant Details**
   - Click on row
   - Modal opens with full information
   - View all submitted data

## Email Notifications

### Acceptance Email
When you click "Accept":
- Applicant receives congratulations email
- Email includes program name
- Contains next steps
- Professional branding with Energy & Logics logo

### Decline Email
When you click "Decline":
- Applicant receives respectful decline message
- Includes encouragement for future applications
- Suggests other programs
- Professional tone maintained

## Advanced Features

### Batch Operations
(Implemented in backend - can be enabled in UI)

**Batch Accept Multiple Applications**
- Select multiple applications
- Click "Batch Accept"
- Send acceptance emails in bulk
- Update all statuses at once

**Batch Decline Multiple Applications**
- Select multiple applications
- Click "Batch Decline"
- Send decline emails in bulk

### Application Details Modal
Click on any application row to view:
- Complete personal information
- Program details and level
- Institution/Profession information
- Additional message or requirements
- Timeline and dates
- Certificate generation status

## Performance Tips

### For Large Datasets
1. **Use Filters First**
   - Narrow results before exporting
   - Reduces file sizes
   - Faster processing

2. **Export in Batches**
   - If dealing with thousands of records
   - Export by program or date
   - Combine reports later

3. **Regular Cleanup**
   - Archive old applications
   - Improves dashboard load time
   - Better data management

### Browser Optimization
- Use modern browsers (Chrome, Firefox, Safari)
- Clear cache periodically
- Disable unnecessary extensions

## Troubleshooting

### Email Not Sent
**Symptoms**: Status updated but email didn't arrive
**Solution**: 
- Check recipient email address is correct
- Verify RESEND_API_KEY is configured
- Check spam folder

### Chart Not Loading
**Symptoms**: Analytics section shows empty charts
**Solution**:
- Refresh page (Ctrl+R or Cmd+R)
- Check internet connection
- Clear browser cache

### Table Not Updating
**Symptoms**: Actions don't reflect immediately
**Solution**:
- Refresh page manually
- Clear application cache
- Try different browser

### Export File Issues
**Symptoms**: Downloaded file is blank or corrupted
**Solution**:
- Try different export format
- Check if data exists in filters
- Contact support with details

## Data Privacy

### Applicant Information
- All data encrypted in database
- Only accessible to authorized admins
- Never shared with third parties
- Complies with data protection regulations

### Export Files
- Generated on-device (browser)
- Not uploaded to servers
- Secure locally after download
- Recommend password-protecting files

## Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| Ctrl+F | Search applicants |
| Ctrl+E | Export current view |
| Ctrl+P | Print as PDF |

*Shortcuts feature coming soon*

## Settings & Preferences

### Current Settings
- Dashboard revalidates every 1 hour
- Timezone: Browser default
- Date format: Local date format

### Future Customization
- Upcoming features will include:
  - Custom stat card selection
  - Theme preferences
  - Email template customization
  - Dashboard layout options

## Support & Help

### Getting Help
- Hover over icons for tooltips
- Check status badge colors for quick reference
- Review this guide for common issues

### Reporting Issues
When reporting bugs include:
- Screenshot of the issue
- Steps to reproduce
- Browser and OS version
- Time the issue occurred

### Feature Requests
We welcome suggestions for improvements:
- Contact admin team
- Describe desired feature
- Explain use case
- Submit via support portal

## Best Practices

### Daily Use
1. ✅ Check dashboard first thing in morning
2. ✅ Review pending applications
3. ✅ Process applications within 24 hours
4. ✅ Document rejections with notes

### Weekly
1. ✅ Generate weekly report
2. ✅ Review program statistics
3. ✅ Check application trends
4. ✅ Follow up with pending decisions

### Monthly
1. ✅ Create comprehensive monthly report
2. ✅ Analyze program performance
3. ✅ Review acceptance/decline ratios
4. ✅ Plan for future programs

## System Requirements

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Network
- Stable internet connection (3+ Mbps)
- Modern router/wifi
- Low latency preferred for real-time updates

### Display
- Minimum 1024x768 resolution
- Tablet friendly (iPad and above)
- Responsive design for all sizes

## Security

### Admin Access
- Secure login required
- Session timeout after 30 minutes of inactivity
- All actions logged and tracked

### Data Security
- All communications encrypted (HTTPS)
- Database backup daily
- Access control lists enforced
- No data shared with external services

### Password Policy
- Minimum 12 characters
- Include uppercase, lowercase, numbers, special characters
- Changed every 90 days
- Never reuse previous passwords

## Glossary

**Application**: A registration submission from an applicant
**Status**: Current decision state (Pending, Accepted, Declined)
**Applicant**: Person who submitted an application
**Program**: Training course or educational path offered
**Certificate**: Document issued upon successful completion
**Analytics**: Data visualization and insights
**Batch Operation**: Action applied to multiple records simultaneously

## Contact & Support

**Email Support**: support@energyandlogics.com
**Response Time**: 24 business hours
**Hours**: Monday-Friday, 9AM-5PM
**Emergency**: Use in-app support chat for urgent issues

---

**Last Updated**: March 2024
**Version**: 1.0
**Dashboard Version**: Professional Edition
