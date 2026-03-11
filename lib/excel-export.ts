// lib/excel-export.ts
export function downloadExcel({ registrations }: { registrations: any[] }) {
  if (!registrations || registrations.length === 0) return

  // Define the headers you want in the Excel/CSV
  const headers = [
    'Full Name',
    'Email',
    'Type',
    'Program',
    'Duration',
    'Status',
    'Application Date',
  ]

  // Map registrations to rows
  const rows = registrations.map((r) => [
    r.full_name || '',
    r.email || '',
    r.registration_type || '',
    r.program || '',
    r.duration || '',
    r.registration_status || '',
    r.created_at ? new Date(r.created_at).toLocaleString() : '',
  ])

  // Convert to CSV string
  const csvContent =
    [headers, ...rows]
      .map((e: (string | number | boolean | null)[]) =>
        e.map((v) => `"${v ?? ''}"`).join(',')
      )
      .join('\n')

  // Create a Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'applications.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}