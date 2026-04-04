'use client'

import { useEffect, useState } from 'react'

export default function StudentAnnouncements() {

  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {

    const load = async () => {

      const res = await fetch('/api/student/announcements')
      const data = await res.json()

      if (data.success) {
        setAnnouncements(data.data)
      }

    }

    load()

  }, [])

  return (

    <div className="space-y-6">

      <h1 className="text-3xl font-bold">
        Announcements
      </h1>

      {announcements.map((a) => (

        <div key={a.id} className="bg-white p-5 rounded shadow">

          <h2 className="font-bold text-lg">
            {a.title}
          </h2>

          <p className="text-slate-600 mt-2">
            {a.message}
          </p>

        </div>

      ))}

    </div>

  )

}