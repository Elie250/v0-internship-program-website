// lib/pdf-export.ts
import { jsPDF } from "jspdf";
import { Registration } from "@/types/registration";

export const downloadPDFReport = ({
  registrations,
  title = "Registrations Report",
}: {
  registrations: Registration[];
  title?: string;
}) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title, 14, 22);

  doc.setFontSize(12);
  const headers = ["Name", "Email", "Type", "Program", "Duration", "Status", "Date"];
  const rows = registrations.map((r) => [
    r.full_name,
    r.email,
    r.registration_type,
    r.program,
    r.duration || "-",
    r.status,
    new Date(r.created_at).toLocaleDateString(),
  ]);

  // Add table manually
  let startY = 30;
  doc.setFont("helvetica", "bold");
  headers.forEach((header, i) => {
    doc.text(header, 14 + i * 28, startY);
  });

  doc.setFont("helvetica", "normal");
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, i) => {
      doc.text(String(cell), 14 + i * 28, startY + 10 + rowIndex * 8);
    });
  });

  doc.save(`${title.replace(/\s/g, "_")}.pdf`);
};