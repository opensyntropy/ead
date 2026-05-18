import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

interface Props {
  params: Promise<{ path: string[] }>
}

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

export async function GET(request: Request, { params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { path: segments } = await params
  // Segurança: bloqueia path traversal
  const safe = segments.map(s => s.replace(/\.\./g, '')).filter(Boolean)
  const filePath = path.join(process.cwd(), 'content', ...safe)

  // Garante que o arquivo está dentro de /content
  if (!filePath.startsWith(path.join(process.cwd(), 'content'))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const buf = await readFile(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME[ext] ?? 'application/octet-stream'
    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
