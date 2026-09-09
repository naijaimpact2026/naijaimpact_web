// app/api/upload/route.ts
// POST /api/upload
// Receives a single file, verifies the user session, enforces type/size limits,
// and proxies the upload to Cloudinary using a server-side signed request.
// The API secret never touches the browser.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signUpload, CLOUDINARY_CLOUD_NAME } from '@/lib/cloudinary'

// Required for App Router — allow up to 5 minutes for large video uploads
export const maxDuration = 300

// ─── Allowed MIME types ────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime', // .mov
  'video/webm',
])

const IMAGE_SIZE_LIMIT = 10 * 1024 * 1024   // 10 MB
const VIDEO_SIZE_LIMIT = 500 * 1024 * 1024  // 500 MB

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verify Supabase session
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse multipart/form-data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const mimeType = file.type

  // 3. Validate MIME type
  const isImage = ALLOWED_IMAGE_TYPES.has(mimeType)
  const isVideo = ALLOWED_VIDEO_TYPES.has(mimeType)

  if (!isImage && !isVideo) {
    return NextResponse.json(
      {
        error: `File type "${mimeType}" is not allowed. Accepted: jpg, png, webp, gif, mp4, mov, webm.`,
      },
      { status: 400 }
    )
  }

  // 4. Enforce size limits
  const sizeLimit = isImage ? IMAGE_SIZE_LIMIT : VIDEO_SIZE_LIMIT
  if (file.size > sizeLimit) {
    const limitMB = isImage ? '10 MB' : '500 MB'
    return NextResponse.json(
      { error: `File exceeds the ${limitMB} size limit.` },
      { status: 413 }
    )
  }

  // 5. Determine Cloudinary resource_type
  const resource_type: 'image' | 'video' = isImage ? 'image' : 'video'

  // 6. Generate signed upload params
  // Note: resource_type must NOT be included in the signature — Cloudinary excludes it
  const { signature, timestamp, apiKey } = signUpload({
    folder: 'hubnovo',
  })

  // 7. Build upload FormData for Cloudinary
  const uploadForm = new FormData()
  uploadForm.append('file', file)
  uploadForm.append('api_key', apiKey)
  uploadForm.append('timestamp', String(timestamp))
  uploadForm.append('signature', signature)
  uploadForm.append('folder', 'hubnovo')
  uploadForm.append('resource_type', resource_type)

  // 8. POST to Cloudinary
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resource_type}/upload`

  let cloudinaryResponse: Response
  try {
    cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadForm,
    })
  } catch (err) {
    console.error('[upload] Cloudinary fetch error:', err)
    return NextResponse.json({ error: 'Failed to reach Cloudinary' }, { status: 502 })
  }

  if (!cloudinaryResponse.ok) {
    const errorBody = await cloudinaryResponse.text()
    console.error('[upload] Cloudinary error response:', errorBody)
    return NextResponse.json(
      { error: 'Cloudinary upload failed', detail: errorBody },
      { status: cloudinaryResponse.status }
    )
  }

  // 9. Extract and return relevant fields
  const data = (await cloudinaryResponse.json()) as {
    secure_url: string
    public_id: string
    width?: number
    height?: number
    duration?: number
  }

  return NextResponse.json({
    url: data.secure_url,
    secure_url: data.secure_url,
    public_id: data.public_id,
    width: data.width ?? null,
    height: data.height ?? null,
    duration: data.duration ?? null,
  })
}
