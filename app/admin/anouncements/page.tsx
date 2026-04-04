'use client'

import { useState, useEffect } from 'react'

export default function AdminAnnouncements() {

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [announcements, setAnnouncements] = useState<any[]>([])

  const loadAnnouncements = async () => {

    const res = await fetch('/api/admin-announcements')
    const data = await res.json()

    if (data.success) {
      setAnnouncements(data.data)
    }

  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const createAnnouncement = async () => {

    const res = await fetch('/api/admin-announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message })
    })

    const data = await res.json()

    if (data.success) {
      setTitle('')
      setMessage('')
      loadAnnouncements()
    }

  }

  return (

    <div className="space-y-8">

      <h1 className="text-3xl font-bold">
        Announcements Management
      </h1>

      {/* Create */}

      <div className="bg-white p-6 rounded-lg shadow space-y-4">

        <input
          className="w-full border p-2 rounded"
          placeholder="Announcement title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border p-2 rounded"
          placeholder="Announcement message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          onClick={createAnnouncement}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Post Announcement
        </button>

      </div>

      {/* List */}

      <div className="space-y-4">

        {announcements.map((a) => (

          <div key={a.id} className="bg-white p-4 shadow rounded">

            <h3 className="font-bold text-lg">
              {a.title}
            </h3>

            <p className="text-slate-600">
              {a.message}
            </p>

          </div>

        ))}

      </div>

    </div>

  )

}