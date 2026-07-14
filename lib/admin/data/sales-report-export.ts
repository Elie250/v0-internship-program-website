import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { FinancialSummary } from '@/lib/admin/data/financial-analytics'
import { COMPANY } from '@/lib/company/constants'
import {
  drawReportAuthorityAfterContent,
  drawReportFooter,
  drawReportHeader,
  loadReportAuthorityAssets,
  loadReportLogoDataUrl,
} from '@/lib/admin/data/report-branding'

function formatRwf(n: number): string {
  return `${Math.round(n).toLocaleString()} RWF`
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Sales / financial PDF with letterhead + Managing Director stamp. */
export async function downloadSalesReportPdf(data: FinancialSummary) {
  const doc = new jsPDF()
  const [logoDataUrl, authority] = await Promise.all([
    loadReportLogoDataUrl(),
    loadReportAuthorityAssets(),
  ])

  const startY = drawReportHeader(doc, {
    title: 'Sales & money traffic',
    subtitle: `${COMPANY.platformName} — financial overview`,
    logoDataUrl,
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 58, 95)
  doc.text('Key metrics', 14, startY)

  autoTable(doc, {
    head: [['Metric', 'Value']],
    body: [
      ['Total website revenue', formatRwf(data.totalRevenue)],
      ['E-learning', formatRwf(data.learningRevenue)],
      ['Support', formatRwf(data.supportRevenue)],
      ['Shop gross', formatRwf(data.shopGrossRevenue)],
      ['Shop COGS', formatRwf(data.shopCogs)],
      ['Shop net profit', formatRwf(data.shopNetProfit)],
      ['POS sales', formatRwf(data.posRevenue)],
      ['Paid shop orders', String(data.shopOrdersPaid)],
      ['Pending shop orders', String(data.shopOrdersPending)],
      ['Pending payment receipts', String(data.pendingPaymentsCount)],
    ],
    startY: startY + 3,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 95] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  })

  if (data.recentShopOrders?.length) {
    doc.addPage()
    const productsTop = 18
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(30, 58, 95)
    doc.text('Recent paid orders', 14, productsTop)

    autoTable(doc, {
      head: [['Order', 'Customer', 'Channel', 'Amount', 'Status']],
      body: data.recentShopOrders.slice(0, 40).map((o) => [
        o.order_number || o.id.slice(0, 8),
        o.customer_name || '—',
        o.channel || '—',
        formatRwf(o.total_amount),
        o.payment_status || '—',
      ]),
      startY: productsTop + 4,
      theme: 'striped',
      headStyles: { fillColor: [184, 148, 31] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
  }

  drawReportAuthorityAfterContent(doc, authority, startY)

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    drawReportFooter(doc, i, pageCount)
  }

  const stamp = new Date().toISOString().split('T')[0]
  doc.save(`energy-logics-sales-report-${stamp}.pdf`)
}

export function downloadSalesReportCsv(data: FinancialSummary) {
  const rows = [
    ['Metric', 'Value'],
    ['Total website revenue', data.totalRevenue],
    ['E-learning', data.learningRevenue],
    ['Support', data.supportRevenue],
    ['Shop gross', data.shopGrossRevenue],
    ['Shop COGS', data.shopCogs],
    ['Shop net profit', data.shopNetProfit],
    ['POS sales', data.posRevenue],
    ['Paid orders', data.shopOrdersPaid],
    ['Pending orders', data.shopOrdersPending],
  ]
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'energy-logics-sales.csv')
}
