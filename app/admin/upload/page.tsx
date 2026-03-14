'use client'

import { useState } from 'react'

export default function UploadPage() {

  const [file, setFile] = useState<File | null>(null)

  const handleUpload = async () => {

    if (!file) return alert("Select image")

    const formData = new FormData()
    formData.append('file', file)

    await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    alert("Image uploaded!")
  }

  return (
    <div className="p-10">

      <h1 className="text-2xl font-bold mb-6">
        Upload Engineering Hub Image
      </h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={handleUpload}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
      >
        Upload
      </button>

    </div>
  )
}