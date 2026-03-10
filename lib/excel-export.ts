export interface ExcelExportData {
  registrations: any[]
  filename?: string
}

export function generateCSVContent(registrations: any[]): string {
  const headers = [
    'Full Name',
    'Email',
    'Phone',
    'Registration Type',
    'School / Profession',
    'Program',
    'Level',
    'Duration',
    'Status',
    'Date Applied',
  ]

  const rows = registrations.map((reg) => [
    escapeCsvValue(reg.full_name),
    escapeCsvValue(reg.email),
    escapeCsvValue(reg.phone || ''),
    escapeCsvValue(reg.registration_type || ''),
    escapeCsvValue(reg.school || reg.profession || ''),
    escapeCsvValue(reg.program || reg.training_program || ''),
    escapeCsvValue(reg.level || ''),
    escapeCsvValue(reg.duration || ''),
    escapeCsvValue(reg.status || 'pending'),
    reg.created_at ? new Date(reg.created_at).toLocaleDateString() : '',
  ])

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')

  return csvContent
}

export function downloadExcel(data: ExcelExportData, filename: string = 'registrations.csv'): void {
  const csvContent = generateCSVContent(data.registrations)

  // Create blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  // Create download link
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function escapeCsvValue(value: string): string {
  if (!value) return ''

  // If the value contains comma, quote, or newline, wrap it in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape any existing quotes by doubling them
    return `"${value.replace(/"/g, '""')}""`
  }

  return value
}

// Advanced Excel export with multiple sheets (requires a library, but we'll provide the structure)
export function generateStatisticsSheet(registrations: any[]): string {
  const headers = ['Metric', 'Count', 'Percentage']

  const total = registrations.length
  const accepted = registrations.filter((r) => r.status === 'accepted').length
  const declined = registrations.filter((r) => r.status === 'declined').length
  const pending = registrations.filter((r) => r.status === 'pending' || !r.status).length
  const students = registrations.filter((r) => r.registration_type === 'Student').length
  const individuals = registrations.filter((r) => r.registration_type === 'Individual').length

  const stats = [
    ['Total Applications', total, '100%'],
    ['Accepted', accepted, `${((accepted / total) * 100).toFixed(1)}%`],
    ['Declined', declined, `${((declined / total) * 100).toFixed(1)}%`],
    ['Pending', pending, `${((pending / total) * 100).toFixed(1)}%`],
    ['Students', students, `${((students / total) * 100).toFixed(1)}%`],
    ['Individuals', individuals, `${((individuals / total) * 100).toFixed(1)}%`],
  ]

  const csvContent = [headers, ...stats].map((row) => row.join(',')).join('\n')

  return csvContent
}

export function downloadStatisticsSheet(registrations: any[]): void {
  const csvContent = generateStatisticsSheet(registrations)

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', 'statistics.csv')
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
