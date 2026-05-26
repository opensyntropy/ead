import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateWatermarkedPDF } from '@/lib/watermark'
import { readFile } from 'fs/promises'
import path from 'path'

export const maxDuration = 30

const DOWNLOAD_LIMIT = 3

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${origin}/reenviar?erro=sem-token`)
  }

  const supabase = await createServiceClient()

  const { data: row, error } = await supabase
    .from('download_tokens')
    .select('email, product, used, download_count, no_limit')
    .eq('token', token)
    .single()

  if (error || !row) {
    return NextResponse.redirect(`${origin}/reenviar?erro=token-invalido`)
  }

  // Compatibilidade com tokens antigos (used=true) + novo limite por contagem
  if (row.used || (!row.no_limit && row.download_count >= DOWNLOAD_LIMIT)) {
    return NextResponse.redirect(`${origin}/reenviar?erro=token-esgotado`)
  }

  // Tokens sem limite: incrementa sem lock. Tokens com limite: optimistic lock anti-race
  let updateError, updated
  if (row.no_limit) {
    ({ error: updateError } = await supabase
      .from('download_tokens')
      .update({ download_count: row.download_count + 1 })
      .eq('token', token))
    if (updateError) return NextResponse.redirect(`${origin}/reenviar?erro=token-invalido`)
  } else {
    ({ data: updated, error: updateError } = await supabase
      .from('download_tokens')
      .update({ download_count: row.download_count + 1 })
      .eq('token', token)
      .eq('download_count', row.download_count)
      .select('token'))
    if (updateError || !updated?.length) {
      return NextResponse.redirect(`${origin}/reenviar?erro=token-esgotado`)
    }
  }

  const masterPath = path.join(process.cwd(), 'ebook.pdf')
  const pdfBytes = new Uint8Array(await readFile(masterPath))
  const watermarked = await generateWatermarkedPDF(pdfBytes, row.email)

  return new Response(watermarked.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Agrofloresta-Sintropica-Michel-Bottan.pdf"',
      'Content-Length': String(watermarked.length),
    },
  })
}
