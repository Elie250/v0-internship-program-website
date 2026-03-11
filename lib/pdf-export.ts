import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export const downloadPDFReport = ({ registrations, title }: any) => {

  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(title, 14, 20)

  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)

  const tableColumn = [
    "Name",
    "Email",
    "Phone",
    "Program",
    "Duration",
    "Level",
    "School",
    "Status",
    "Date"
  ]

  const tableRows: any[] = []

  registrations.forEach((r: any) => {

    const row = [
      r.full_name,
      r.email,
      r.phone,
      r.program,
      r.duration,
      r.current_level,
      r.school,
      r.status || "pending",
      new Date(r.created_at).toLocaleDateString()
    ]

    tableRows.push(row)

  })

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35
  })

  doc.save("energy-logics-applications.pdf")

}