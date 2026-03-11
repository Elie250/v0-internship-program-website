export function downloadExcel({ registrations }: { registrations: any[] }) {
  const headers = ['Name', 'Email', 'Type', 'Program', 'Duration', 'Status', 'Date']
  const rows = registrations.map(r => [
    r.full_name,
    r.email,
    r.registration_type,
    r.program,
    r.duration,
    r.status || 'Pending',
    new Date(r.created_at).toLocaleDateString(),
  ])

  const csvContent =
    [headers, ...rows]
      .map(row => row.map(v => `"${v}"`).join(','))
      .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'registrations.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}