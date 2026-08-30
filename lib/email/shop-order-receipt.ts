import { sendEmail, type SendEmailResult } from '@/lib/email/core'
import { receiptAttachmentFilename } from '@/lib/shop/customer-receipt-email'

export async function sendShopOrderReceiptEmail(input: {
  to: string
  orderNumber: string
  receiptHtml: string
}): Promise<SendEmailResult> {
  return sendEmail({
    to: input.to,
    subject: `Official order receipt — ${input.orderNumber}`,
    html: input.receiptHtml,
    attachments: [
      {
        filename: receiptAttachmentFilename(input.orderNumber),
        content: input.receiptHtml,
        contentType: 'text/html',
      },
    ],
  })
}
