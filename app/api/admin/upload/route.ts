import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      )
    }

    // TODO: save the file to Supabase or other storage
    // Example: upload to Supabase Storage
    // await supabase.storage.from('uploads').upload(file.name, file)

    return NextResponse.json({ success: true, message: 'File uploaded successfully' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, message: 'Server error during upload' },
      { status: 500 }
    )
  }
}