import { readFile } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ chapterId: string; img: string }>
}

export async function GET(_req: Request, { params }: Params) {
  const { chapterId, img } = await params

  // Bloqueia path traversal
  if (chapterId.includes('..') || img.includes('..')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filePath = path.join(process.cwd(), 'content', chapterId, img)
  try {
    const buf = await readFile(filePath)
    const ext = path.extname(img).slice(1).toLowerCase()
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
    return new NextResponse(buf, { headers: { 'Content-Type': mime } })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
