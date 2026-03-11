// lib/pdf-export.ts
import 'jspdf-autotable'
import jsPDF from 'jspdf'

interface Registration {
  full_name: string
  email: string
  registration_type: string
  program: string
  duration: string
  registration_status: string
  created_at: string
}

interface PDFExportProps {
  registrations: Registration[]
  title?: string
}

export function downloadPDFReport({ registrations, title = 'Applications Report' }: PDFExportProps) {
  if (!registrations || registrations.length === 0) return

  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text(title, 14, 22)

  // Table header
  const headers = [
    'Full Name',
    'Email',
    'Type',
    'Program',
    'Duration',
    'Status',
    'Application Date',
  ]

  const rows = registrations.map(r => [
    r.full_name || '',
    r.email || '',
    r.registration_type || '',
    r.program || '',
    r.duration || '',
    r.registration_status || '',
    r.created_at ? new Date(r.created_at).toLocaleString() : '',
  ])

  // Auto-table setup
  // You need jspdf-autotable
  // If not installed, do: pnpm add jspdf-autotable
  // @ts-ignore
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 30,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [54, 162, 235] },
  })

  doc.save('applications.pdf')
}