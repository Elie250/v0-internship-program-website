export interface ExportData {
  registrations: any[]
  title?: string
  generatedDate?: Date
}

export function generatePDFReport(data: ExportData): string {
  const { registrations, title = 'Registrations Report', generatedDate = new Date() } = data

  // Calculate statistics
  const total = registrations.length
  const accepted = registrations.filter((r) => r.status === 'accepted').length
  const declined = registrations.filter((r) => r.status === 'declined').length
  const pending = registrations.filter((r) => r.status === 'pending' || !r.status).length
  const students = registrations.filter((r) => r.registration_type === 'Student').length
  const individuals = registrations.filter((r) => r.registration_type === 'Individual').length

  // Group by program
  const programStats: Record<string, number> = {}
  registrations.forEach((reg) => {
    const program = reg.program || reg.training_program || 'Other'
    programStats[program] = (programStats[program] || 0) + 1
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          margin: 20mm;
          size: A4;
        }
        
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          background: white;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #0066cc;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          color: #0066cc;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        
        .header p {
          margin: 5px 0;
          color: #666;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .stat-card {
          background: #f5f7fa;
          padding: 15px;
          border-left: 4px solid #0066cc;
          border-radius: 4px;
        }
        
        .stat-card.accepted {
          border-left-color: #00c853;
        }
        
        .stat-card.declined {
          border-left-color: #d32f2f;
        }
        
        .stat-card.pending {
          border-left-color: #ff6f00;
        }
        
        .stat-card.students {
          border-left-color: #7b1fa2;
        }
        
        .stat-card.individuals {
          border-left-color: #0097a7;
        }
        
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #0066cc;
        }
        
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section h2 {
          color: #0066cc;
          font-size: 18px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        th {
          background: #0066cc;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
        }
        
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }
        
        tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          min-width: 70px;
        }
        
        .status-accepted {
          background: #c8e6c9;
          color: #00c853;
        }
        
        .status-declined {
          background: #ffcdd2;
          color: #d32f2f;
        }
        
        .status-pending {
          background: #ffe0b2;
          color: #ff6f00;
        }
        
        .program-list {
          list-style: none;
          padding: 0;
        }
        
        .program-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .program-count {
          font-weight: 600;
          color: #0066cc;
        }
        
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #999;
          font-size: 11px;
          margin-top: 40px;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ ${title}</h1>
          <p>Generated on ${generatedDate.toLocaleDateString()} at ${generatedDate.toLocaleTimeString()}</p>
          <p>Total Records: ${total}</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Applications</div>
            <div class="stat-value">${total}</div>
          </div>
          <div class="stat-card accepted">
            <div class="stat-label">Accepted</div>
            <div class="stat-value">${accepted}</div>
          </div>
          <div class="stat-card declined">
            <div class="stat-label">Declined</div>
            <div class="stat-value">${declined}</div>
          </div>
          <div class="stat-card pending">
            <div class="stat-label">Pending</div>
            <div class="stat-value">${pending}</div>
          </div>
          <div class="stat-card students">
            <div class="stat-label">Students</div>
            <div class="stat-value">${students}</div>
          </div>
          <div class="stat-card individuals">
            <div class="stat-label">Individuals</div>
            <div class="stat-value">${individuals}</div>
          </div>
        </div>
        
        <div class="section">
          <h2>Applications by Program</h2>
          <ul class="program-list">
            ${Object.entries(programStats)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(
                ([program, count]) =>
                  `<li class="program-item">
                    <span>${program}</span>
                    <span class="program-count">${count}</span>
                  </li>`
              )
              .join('')}
          </ul>
        </div>
        
        <div class="section">
          <h2>Detailed Application List</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Program</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${registrations
                .map(
                  (reg) => `
                <tr>
                  <td>${reg.full_name}</td>
                  <td>${reg.email}</td>
                  <td>${reg.registration_type || '-'}</td>
                  <td>${reg.program || reg.training_program || '-'}</td>
                  <td>
                    <span class="status-badge status-${reg.status || 'pending'}">
                      ${(reg.status || 'pending').charAt(0).toUpperCase() + (reg.status || 'pending').slice(1)}
                    </span>
                  </td>
                  <td>${new Date(reg.created_at).toLocaleDateString()}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>This report was generated by Energy & Logics Admin Dashboard</p>
        </div>
      </div>
      
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 500);
        });
      </script>
    </body>
    </html>
  `

  return html
}

export function downloadPDFReport(data: ExportData, filename: string = 'report.pdf'): void {
  const html = generatePDFReport(data)
  const newWindow = window.open()
  if (newWindow) {
    newWindow.document.write(html)
    newWindow.document.close()
  }
}
