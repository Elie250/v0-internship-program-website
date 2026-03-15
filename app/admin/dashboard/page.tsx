'use client'

import Link from 'next/link'
import { Upload, ImageIcon, Settings } from 'lucide-react'

export default function Dashboard() {

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        Engineering Hub Admin Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <Link
          href="/admin/upload"
          className="p-6 border rounded-lg shadow hover:shadow-lg"
        >
          <Upload size={40} />
          <h2 className="text-xl font-semibold mt-3">
            Upload Pictures
          </h2>
          <p>Add PLC, Arduino, workshop images</p>
        </Link>

        <Link
          href="/admin/gallery"
          className="p-6 border rounded-lg shadow hover:shadow-lg"
        >
          <ImageIcon size={40} />
          <h2 className="text-xl font-semibold mt-3">
            Manage Gallery
          </h2>
          <p>Edit engineering hub pictures</p>
        </Link>

        <Link
          href="/admin/settings"
          className="p-6 border rounded-lg shadow hover:shadow-lg"
        >
          <Settings size={40} />
          <h2 className="text-xl font-semibold mt-3">
            Website Settings
          </h2>
          <p>Edit contact and services</p>
        </Link>

      </div>

    </div>
  )
}