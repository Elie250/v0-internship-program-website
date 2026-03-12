// lib/certificates-generator.ts
'use client'

import { jsPDF } from 'jspdf'

export interface Registration {
  full_name: string
  email: string
  program: string
  duration?: string
  registration_type?: string
  registration_status?: string
  created_at?: string
}

export async function generateCertificate(registration: Registration) {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    })

    // Draw border
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(2)
    doc.rect(20, 20, 800, 550)

    // Certificate title
    doc.setFontSize(40)
    doc.setFont('helvetica', 'bold')
    doc.text('Certificate of Completion', 430, 100, { align: 'center' })

    // Participant name
    doc.setFontSize(28)
    doc.setFont('helvetica', 'normal')
    doc.text(
      registration.full_name || 'Participant',
      430,
      200,
      { align: 'center' }
    )

    // Program info
    doc.setFontSize(20)
    doc.text(
      `has successfully completed the ${registration.program || 'program'}`,
      430,
      250,
      { align: 'center' }
    )

    if (registration.duration) {
      doc.text(`Duration: ${registration.duration}`, 430, 300, { align: 'center' })
    }

    // Date
    const date = new Date().toLocaleDateString()
    doc.setFontSize(16)
    doc.text(`Date: ${date}`, 430, 400, { align: 'center' })

    // Signature placeholder
    doc.setFontSize(18)
    doc.text('_________________________', 200, 500)
    doc.text('Authorized Signature', 200, 520)

    // Save file
    const fileName = `${registration.full_name || 'certificate'}.pdf`
    doc.save(fileName)
  } catch (err) {
    console.error('Error generating certificate:', err)
  }
}