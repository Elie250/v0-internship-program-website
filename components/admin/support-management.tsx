'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SupportManagement() {
  const [tickets, setTickets] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/support-tickets')
      .then((r) => r.json())
      .then((data) => setTickets(Array.isArray(data) ? data : []))
  }, [])

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No support tickets yet.</CardContent></Card>
      ) : (
        tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{ticket.title}</CardTitle>
              <Badge>{ticket.status}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{ticket.description}</p>
              <p className="mt-2 text-xs">{ticket.category?.name ?? 'Uncategorized'} · {new Date(ticket.created_at).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
