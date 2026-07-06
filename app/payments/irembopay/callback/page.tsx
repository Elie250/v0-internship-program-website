import { Suspense } from 'react'
import { IremboPayCallbackInner } from '@/components/payment/irembopay-callback-inner'
import { Loader2 } from 'lucide-react'

type PageProps = {
  searchParams: Promise<{
    transactionId?: string
    invoiceNumber?: string
    transaction_id?: string
    invoice_number?: string
  }>
}

export default async function IremboPayCallbackPage({ searchParams }: PageProps) {
  const params = await searchParams
  const transactionId = params.transactionId || params.transaction_id
  const invoiceNumber = params.invoiceNumber || params.invoice_number

  return (
    <main className="container max-w-2xl py-16">
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <IremboPayCallbackInner transactionId={transactionId} invoiceNumber={invoiceNumber} />
      </Suspense>
    </main>
  )
}
