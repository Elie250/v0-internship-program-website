export const downloadExcel = ({ registrations }: any) => {

  const headers = [
    "Full Name",
    "Email",
    "Phone",
    "Program",
    "Duration",
    "Current Level",
    "School",
    "Field of Study",
    "Province",
    "District",
    "Date of Birth",
    "Motivation",
    "Status",
    "Date Applied"
  ]

  const rows = registrations.map((r: any) => [
    r.full_name || '',
    r.email || '',
    r.phone || '',
    r.program || '',
    r.duration || '',
    r.current_level || '',
    r.school || '',
    r.field_of_study || '',
    r.province || '',
    r.district || '',
    r.date_of_birth || '',
    r.motivation || '',
    r.status || 'pending',
    new Date(r.created_at).toLocaleDateString()
  ])

  const csvContent =
    [headers, ...rows]
      .map(e => e.map(v => `"${v}"`).join(","))
      .join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)

  link.download = `energy-logics-applications-${new Date().toISOString().slice(0, 10)}.csv`

  link.click()
}