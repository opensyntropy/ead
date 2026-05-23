import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateWatermarkedPDF } from '@/lib/watermark'
import { readFile } from 'fs/promises'
import path from 'path'

export const maxDuration = 30

export async function GET(request: Request) {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })
  }

  const masterPath = path.join(process.cwd(), 'ebook.pdf')
  const pdfBytes = new Uint8Array(await readFile(masterPath))
  const watermarked = await generateWatermarkedPDF(pdfBytes, email)

  const filename = `Agricultura-Sintropica-${email.split('@')[0]}.pdf`

  return new Response(watermarked.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(watermarked.length),
    },
  })
}
