import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { getConteudo } from '@/lib/conteudo'
import { getDestinosEmail } from '@/lib/inscritos'
import { DEV_DESTINO, enviarEmLotes, enviarUm, htmlNovaAula } from '@/lib/avisos'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// "Avisar sobre nova aula": e-mail para todos os inscritos ativos da lista de vídeos.
// preview → HTML; testTo → só um endereço; dryRun → só a contagem; senão envia em lotes e grava em video_avisos.
export async function POST(req: NextRequest) {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null) as {
    href?: string; assunto?: string; mensagem?: string
    preview?: boolean; testTo?: string; dryRun?: boolean; repetir?: boolean
  } | null
  if (!body?.href) return NextResponse.json({ message: 'Escolha a aula.' }, { status: 400 })

  const item = (await getConteudo()).find(i => i.href === body.href)
  if (!item) return NextResponse.json({ message: 'Aula não encontrada.' }, { status: 404 })

  const assunto = body.assunto?.trim() || `Aula nova: ${item.titulo}`
  const html = htmlNovaAula(assunto, body.mensagem ?? '', { titulo: item.titulo, resumo: item.resumo, imagem: item.imagem, href: item.href })

  if (body.preview) return NextResponse.json({ html: html.replaceAll('{{sair}}', '#') })

  if (body.testTo !== undefined) {
    const to = body.testTo.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return NextResponse.json({ message: 'E-mail de teste inválido.' }, { status: 400 })
    try {
      await enviarUm(to, `Teste: ${assunto}`, html)
    } catch (e) {
      return NextResponse.json({ message: `Falha no teste: ${(e as Error).message}` }, { status: 500 })
    }
    return NextResponse.json({ message: `Teste enviado para ${to}.` })
  }

  const service = createServiceClient()
  let destinos: string[]
  try {
    destinos = await getDestinosEmail()
  } catch (e) {
    return NextResponse.json({ message: `Erro ao ler inscritos: ${(e as Error).message}` }, { status: 500 })
  }

  const { data: anteriores } = await service.from('video_avisos').select('created_at, enviados').eq('href', item.href).order('created_at', { ascending: false }).limit(1)
  const jaAvisado = anteriores?.[0]

  if (body.dryRun) return NextResponse.json({ count: destinos.length, jaAvisado: jaAvisado ?? null })

  if (jaAvisado && !body.repetir) {
    return NextResponse.json({ message: `Esta aula já foi avisada em ${new Date(jaAvisado.created_at).toLocaleString('pt-BR')} (${jaAvisado.enviados} e-mails). Marque "enviar de novo" para repetir.` }, { status: 409 })
  }
  if (destinos.length === 0) return NextResponse.json({ message: 'Nenhum inscrito com e-mail ativo.' }, { status: 400 })

  // em dev, nunca dispara para a lista real
  const recipients = process.env.NODE_ENV === 'production' ? destinos : [DEV_DESTINO]
  const { enviados, falhas } = await enviarEmLotes(recipients, assunto, html)
  if (falhas.length) console.error('[avisar-aula] falhas:', falhas)

  if (enviados > 0) {
    const { error } = await service.from('video_avisos').insert({ href: item.href, assunto, enviados, falhas: falhas.length })
    if (error) console.error('[avisar-aula] histórico', error)
  }
  if (enviados === 0) return NextResponse.json({ message: `Falha ao enviar: ${falhas[0] ?? 'erro desconhecido'}` }, { status: 500 })

  return NextResponse.json({
    message: falhas.length
      ? `Enviado para ${enviados}. ${falhas.length} falha(s), ex.: ${falhas[0]}`
      : `Aviso enviado para ${enviados} inscrito(s)!`,
    sent: enviados,
  })
}
