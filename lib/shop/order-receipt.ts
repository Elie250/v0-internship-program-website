import { COMPANY } from '@/lib/company/constants'
import { getOrderQrImageUrl, getOrderReceiptUrl } from '@/lib/shop/order-lookup'

export type OrderReceiptItem = {
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type OrderReceiptData = {
  orderNumber: string
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  fulfillmentType?: string | null
  deliveryAddress?: string | null
  notes?: string | null
  totalAmount: number
  orderStatus?: string | null
  paymentStatus?: string | null
  paymentMethod?: string | null
  orderDate: Date | string
  items: OrderReceiptItem[]
  logoUrl?: string
  stampUrl?: string
  signatoryName?: string
  signatoryTitle?: string
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatMoney(amount: number): string {
  return `${Number(amount || 0).toLocaleString()} RWF`
}

/**
 * Printable shop / POS receipt with order code, QR (lookup), and Managing Director stamp.
 * Attach to delivery or give to the client for refund claims.
 */
export function createOrderReceiptHTML(data: OrderReceiptData): string {
  const orderNumber = escapeHtml(data.orderNumber)
  const date = new Date(data.orderDate)
  const formattedDate = date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const fulfillment =
    data.fulfillmentType === 'delivery' ? 'Delivery' : 'Local pickup'
  const roleLine =
    String(data.signatoryTitle || 'Managing Director')
      .split('·')[0]
      ?.trim() || 'Managing Director'
  const receiptUrl = getOrderReceiptUrl(data.orderNumber)
  const qrUrl = getOrderQrImageUrl(data.orderNumber)

  const rows = data.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.productName)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatMoney(item.unitPrice)}</td>
        <td class="num">${formatMoney(item.lineTotal)}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt — ${orderNumber}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      color: #2d3748;
      background: #f1f5f9;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      max-width: 190mm;
      margin: 8mm auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      padding: 10mm 12mm;
    }
    .top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      border-bottom: 2px solid #3a3a3a;
      padding-bottom: 8mm;
      margin-bottom: 6mm;
    }
    .brand img { height: 42px; width: auto; max-width: 140px; object-fit: contain; }
    .brand h1 {
      font-size: 18px;
      color: #3a3a3a;
      margin-top: 4px;
    }
    .brand p { font-size: 11px; color: #64748b; margin-top: 2px; }
    .code-box { text-align: right; }
    .code-box .label {
      font-family: system-ui, sans-serif;
      font-size: 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #64748b;
    }
    .code-box .code {
      font-family: ui-monospace, monospace;
      font-size: 16px;
      font-weight: 700;
      color: #3a3a3a;
      margin-top: 2px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #3a3a3a;
      margin-bottom: 2mm;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4mm 8mm;
      font-size: 12px;
      margin-bottom: 6mm;
    }
    .meta strong { color: #3a3a3a; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 4mm;
    }
    th, td {
      border-bottom: 1px solid #e2e8f0;
      padding: 2.2mm 1.5mm;
      text-align: left;
    }
    th {
      font-family: system-ui, sans-serif;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    td.num, th.num { text-align: right; }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 700;
      color: #3a3a3a;
      border-top: 2px solid #3a3a3a;
      padding-top: 3mm;
      margin-top: 2mm;
    }
    .bottom {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10mm;
      margin-top: 10mm;
      align-items: end;
    }
    .sig-block {
      position: relative;
      min-height: 48mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .sig-text { position: relative; z-index: 1; }
    .stamp {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 48mm;
      height: 48mm;
      object-fit: contain;
      opacity: 0.9;
      transform: translate(-50%, -50%) rotate(-12deg);
      mix-blend-mode: multiply;
      z-index: 2;
      pointer-events: none;
    }
    .sig-name {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #3a3a3a;
    }
    .sig-rule {
      width: 42mm;
      border-top: 1.25px solid #2d3748;
      margin: 2mm auto 1.5mm;
    }
    .sig-title {
      font-family: system-ui, sans-serif;
      font-size: 10px;
      color: #5a6472;
    }
    .qr-col { text-align: center; }
    .qr-col img {
      width: 32mm;
      height: 32mm;
      border: 1px solid #e2e8f0;
      padding: 2mm;
      background: #fff;
    }
    .qr-col .hint {
      font-family: system-ui, sans-serif;
      font-size: 9px;
      color: #64748b;
      margin-top: 2mm;
      max-width: 50mm;
      margin-left: auto;
      margin-right: auto;
      word-break: break-all;
    }
    .footer {
      margin-top: 8mm;
      padding-top: 3mm;
      border-top: 1px solid #e2e8f0;
      font-family: system-ui, sans-serif;
      font-size: 9px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { background: #fff; }
      .sheet { border: none; margin: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div class="brand">
        ${
          data.logoUrl
            ? `<img src="${escapeHtml(data.logoUrl)}" alt="${escapeHtml(COMPANY.brandName)}">`
            : `<h1>${escapeHtml(COMPANY.legalName)}</h1>`
        }
        <h1>${escapeHtml(COMPANY.legalName)}</h1>
        <p>${escapeHtml(COMPANY.slogan)} · ${escapeHtml(COMPANY.address)}</p>
      </div>
      <div class="code-box">
        <div class="label">Order code</div>
        <div class="code">${orderNumber}</div>
        <div class="label" style="margin-top:3mm">Issued</div>
        <div style="font-size:12px;margin-top:1px">${escapeHtml(formattedDate)}</div>
      </div>
    </div>

    <div class="title">Official order receipt</div>

    <div class="meta">
      <div><strong>Customer:</strong> ${escapeHtml(data.customerName)}</div>
      <div><strong>Fulfillment:</strong> ${escapeHtml(fulfillment)}</div>
      ${
        data.customerPhone
          ? `<div><strong>Phone:</strong> ${escapeHtml(data.customerPhone)}</div>`
          : ''
      }
      ${
        data.customerEmail
          ? `<div><strong>Email:</strong> ${escapeHtml(data.customerEmail)}</div>`
          : ''
      }
      ${
        data.fulfillmentType === 'delivery' && data.deliveryAddress
          ? `<div style="grid-column:1/-1"><strong>Delivery address:</strong> ${escapeHtml(
              data.deliveryAddress
            )}</div>`
          : ''
      }
      <div><strong>Order status:</strong> ${escapeHtml(
        (data.orderStatus || 'pending').replace(/_/g, ' ')
      )}</div>
      <div><strong>Payment:</strong> ${escapeHtml(
        [data.paymentStatus, data.paymentMethod].filter(Boolean).join(' · ') || '—'
      )}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Unit</th>
          <th class="num">Line</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="4">No line items</td></tr>`}
      </tbody>
    </table>
    <div class="total-row">
      <span>Total</span>
      <span>${formatMoney(data.totalAmount)}</span>
    </div>

    <div class="bottom">
      <div class="sig-block">
        <div class="sig-text">
          <div class="sig-name">${escapeHtml(data.signatoryName || 'Elie BISAMAZA')}</div>
          <div class="sig-rule"></div>
          <div class="sig-title">${escapeHtml(roleLine)}</div>
        </div>
        ${
          data.stampUrl
            ? `<img class="stamp" src="${escapeHtml(data.stampUrl)}" alt="Company stamp">`
            : ''
        }
      </div>
      <div class="qr-col">
        <img src="${escapeHtml(qrUrl)}" alt="Scan order receipt">
        <div class="hint">Scan for order details<br>${escapeHtml(receiptUrl)}</div>
      </div>
    </div>

    <div class="footer">
      ${escapeHtml(COMPANY.legalName)} · ${escapeHtml(COMPANY.email)} · ${escapeHtml(
        COMPANY.phoneDisplay
      )} · www.energyandlogics.com
    </div>
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.print(); }, 700);
    });
  </script>
</body>
</html>`
}
