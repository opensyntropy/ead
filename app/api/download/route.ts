import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateWatermarkedPDF } from '@/lib/watermark'
import { readFile } from 'fs/promises'
import path from 'path'

export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${origin}/reenviar?erro=sem-token`)
  }

  const supabase = await createServiceClient()

  const { data: row, error } = await supabase
    .from('download_tokens')
    .select('email, product, used')
    .eq('token', token)
    .single()

  if (error || !row) {
    return NextResponse.redirect(`${origin}/reenviar?erro=token-invalido`)
  }

  if (row.used) {
    return NextResponse.redirect(`${origin}/reenviar?erro=token-usado`)
  }

  // Marca como usado atomicamente (evita race conditions)
  const { data: updated, error: updateError } = await supabase
    .from('download_tokens')
    .update({ used: true })
    .eq('token', token)
    .eq('used', false)
    .select('token')

  if (updateError || !updated?.length) {
    return NextResponse.redirect(`${origin}/reenviar?erro=token-usado`)
  }

  const masterPath = path.join(process.cwd(), 'ebook.pdf')
  const pdfBytes = new Uint8Array(await readFile(masterPath))
  const watermarked = await generateWatermarkedPDF(pdfBytes, row.email)

  return new Response(watermarked.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Agricultura-Sintropica.pdf"',
      'Content-Length': String(watermarked.length),
    },
  })
}
