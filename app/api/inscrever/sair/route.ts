import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeEmail, verifyVideoUnsubscribeToken } from '@/lib/unsubscribe'

// Sai da lista de e-mail dos avisos de vídeo. One-click (RFC 8058): Gmail/Outlook fazem POST aqui
// pelo botão "Cancelar inscrição", e a página /avisos/sair também. GET não descadastra
// (antivírus de e-mail abrem os links).
export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('e') ?? ''
  const token = req.nextUrl.searchParams.get('t') ?? ''
  if (!email || !token || !verifyVideoUnsubscribeToken(email, token)) {
    return NextResponse.json({ message: 'Link inválido.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('video_subscribers')
    .update({ email_descadastrado_em: new Date().toISOString() })
    .eq('email', normalizeEmail(email))
    .is('email_descadastrado_em', null)
  if (error) {
    console.error('[inscrever/sair]', error)
    return NextResponse.json({ message: 'Erro ao descadastrar.' }, { status: 500 })
  }
  return NextResponse.json({ message: 'Descadastrado.' })
}
