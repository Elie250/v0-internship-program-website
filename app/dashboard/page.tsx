'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logoutUser } from '@/app/actions/auth-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROLE_LABELS } from '@/types/platform'
import { BookOpen, Headphones, Home, LogOut, ShoppingBag, User } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser().then((current) => {
      if (!current) {
        router.push('/auth/login')
        return
      }
      setUser(current)
    })
  }, [router])

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  if (!user) return null

  const roleLabel = ROLE_LABELS[user.role] ?? user.role
  const isAdmin = user.role === 'admin'
  const isStaff = ['support_staff', 'engineer'].includes(user.role)
  const isInstructor = ['instructor', 'lecturer'].includes(user.role)
  const isMentor = user.role === 'mentor'

  return (
    <main className="min-h-screen bg-background">
      <header className="text-on-dark bg-[var(--brand-navy)] px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">User Dashboard</h1>
            <p className="text-sm text-white/80">{user.firstName} {user.lastName} · {roleLabel}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/"><Button variant="secondary" size="sm"><Home className="w-4 h-4 mr-1" /> Home</Button></Link>
            <Button variant="secondary" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4" /> Profile</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{user.email}</p>
            <p className="mt-1">Role: {roleLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Courses</CardTitle></CardHeader>
          <CardContent>
            <Link href="/student/dashboard"><Button variant="outline" size="sm">View Enrolled Courses</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Orders</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Order history will appear here.</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Headphones className="w-4 h-4" /> Support Tickets</CardTitle></CardHeader>
          <CardContent>
            <Link href="/engineering-support"><Button variant="outline" size="sm">Submit / View Tickets</Button></Link>
          </CardContent>
        </Card>

        {isInstructor && (
          <Card>
            <CardHeader><CardTitle>Instructor Tools</CardTitle></CardHeader>
            <CardContent><Link href="/lecturer/dashboard"><Button size="sm">Lecturer Dashboard</Button></Link></CardContent>
          </Card>
        )}

        {isMentor && (
          <Card>
            <CardHeader><CardTitle>Mentor portal</CardTitle></CardHeader>
            <CardContent>
              <Link href="/lecturer/dashboard"><Button size="sm">Career programmes</Button></Link>
            </CardContent>
          </Card>
        )}

        {isStaff && (
          <Card>
            <CardHeader><CardTitle>Support Staff</CardTitle></CardHeader>
            <CardContent><Link href="/engineer/dashboard"><Button size="sm">Support Dashboard</Button></Link></CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader><CardTitle>Admin Portal</CardTitle></CardHeader>
            <CardContent><Link href="/admin/dashboard"><Button size="sm" className="bg-[#1e3a5f]">Open Admin CMS</Button></Link></CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}
