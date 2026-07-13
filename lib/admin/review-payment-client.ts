export async function reviewPaymentRequest(input: {
  id: string
  decision: 'approved' | 'rejected'
  adminNotes?: string
}): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/admin/payments/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(input),
  })

  let data: { success?: boolean; error?: string } = {}
  try {
    data = await res.json()
  } catch {
    return { success: false, error: 'Invalid response from server' }
  }

  if (!res.ok) {
    return { success: false, error: data.error || 'Payment review failed' }
  }

  return { success: Boolean(data.success), error: data.error }
}
