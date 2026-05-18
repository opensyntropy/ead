import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${origin}/reenviar?erro=sem-token`)
  }

  const supabase = await createServiceClient()

  const { data: row, error } = await supabase
    .from('download_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !row) {
    return NextResponse.redirect(`${origin}/reenviar?erro=token-invalido`)
  }

  if (row.used) {
    return NextResponse.redirect(`${origin}/reenviar?erro=token-usado`)
  }

  // Marca como usado antes de gerar o link (evita race conditions)
  const { error: updateError } = await supabase
    .from('download_tokens')
    .update({ used: true })
    .eq('token', token)
    .eq('used', false) // garante atomicidade

  if (updateError) {
    return NextResponse.redirect(`${origin}/reenviar?erro=token-usado`)
  }

  const fileName = `${row.product}.pdf`
  const { data: signed, error: storageError } = await supabase.storage
    .from('ebooks')
    .createSignedUrl(fileName, 120) // 120s para iniciar o download

  if (storageError || !signed) {
    console.error('Storage error:', storageError)
    return NextResponse.json({ error: 'Erro ao gerar link de download' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
