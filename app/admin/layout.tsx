'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'

import {
  LayoutDashboard,
  Users,
  Video,
  FolderKanban,
  LogOut
} from 'lucide-react'

export default function AdminLayout({ children }: { children: ReactNode }) {

  const pathname = usePathname()
  const router = useRouter()

  // Pages that should NOT show admin layout
  const publicPages = [
    '/admin/login',
    '/admin/register'
  ]

  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {

    if (!isPublicPage) {

      const adminAuth = localStorage.getItem('admin_authenticated')

      if (!adminAuth) {
        router.push('/admin/login')
      }

    }

  }, [pathname])

  const handleLogout = () => {

    localStorage.removeItem('admin_authenticated')
    router.push('/admin/login')

  }

  const navItems = [

    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard'
    },
    {
      name: 'Applications',
      icon: Users,
      path: '/admin/applications'
    }
    {
      name: 'Users',
      icon: Users,
      path: '/admin/users'
    },

    {
      name: 'Webinars',
      icon: Video,
      path: '/admin/webinars'
    },

    {
      name: 'Projects',
      icon: FolderKanban,
      path: '/admin/projects'
    }

  ]

  // LOGIN / REGISTER pages (no sidebar)
  if (isPublicPage) {
    return <>{children}</>
  }

  return (

    <div className="flex min-h-screen bg-slate-100">

      {/* SIDEBAR */}

      <aside className="w-64 bg-white shadow-lg flex flex-col">

        <div className="p-6 border-b">

          <h2 className="text-xl font-bold text-slate-800">
            Energy & Logic
          </h2>

          <p className="text-sm text-slate-500">
            Admin Office
          </p>

        </div>

        <nav className="flex-1 p-4 space-y-2">

          {navItems.map((item) => {

            const Icon = item.icon
            const active = pathname === item.path

            return (

              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition
                ${active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                  }`}
              >

                <Icon className="w-5 h-5" />

                {item.name}

              </Link>

            )

          })}

        </nav>

        <div className="p-4 border-t">

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
          >

            <LogOut className="w-5 h-5" />

            Logout

          </button>

        </div>

      </aside>

      {/* PAGE CONTENT */}

      <main className="flex-1 p-8 overflow-y-auto">

        {children}

      </main>

    </div>

  )

}