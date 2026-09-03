import { z } from 'zod'

export const checkoutDetailsSchema = z
  .object({
    customerName: z.string().trim().min(1, 'name'),
    customerEmail: z.string().trim().email('email'),
    customerPhone: z.string().trim().min(1, 'phone'),
    fulfillmentType: z.enum(['pickup', 'delivery']),
    deliveryAddress: z.string().trim(),
    notes: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.fulfillmentType === 'delivery' && !value.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deliveryAddress'],
        message: 'address',
      })
    }
  })

export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>

export function hasMoMoProof(receiptUrl: string, receiptNumber: string): boolean {
  return Boolean(receiptUrl.trim() || receiptNumber.trim())
}

export function emptyCartCannotCheckout(lineCount: number): boolean {
  return lineCount < 1
}
