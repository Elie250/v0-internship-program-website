interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  school: string;
  program: string;
  level: string;
  duration: string;
  message: string;
  created_at: string;
}

export async function exportToCSV(registrations: Registration[]) {
  if (registrations.length === 0) {
    throw new Error('No data to export');
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Full Name',
    'Email',
    'Phone',
    'School',
    'Program',
    'Level',
    'Duration',
    'Message',
    'Registration Date',
  ];

  // Convert data to CSV rows
  const rows = registrations.map((reg) => [
    reg.id,
    escapeCsvField(reg.full_name),
    escapeCsvField(reg.email),
    escapeCsvField(reg.phone),
    escapeCsvField(reg.school),
    reg.program,
    reg.level,
    escapeCsvField(reg.duration),
    escapeCsvField(reg.message || ''),
    new Date(reg.created_at).toLocaleString(),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `internship-registrations-${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCsvField(field: string): string {
  // If field contains comma, quotes, or newlines, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
