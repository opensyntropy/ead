import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeEmail } from '@/lib/unsubscribe'
import { toWaNumber } from '@/lib/phone'

// Inscrição para aviso de novos vídeos (e-mail e/ou WhatsApp). Grava em video_subscribers.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { email?: string; whatsapp?: string; origem?: string; site?: string } | null
  if (!body) return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 })
  // honeypot: o campo "site" fica escondido; robô preenche, gente não
  if (body.site) return NextResponse.json({ message: 'Inscrição feita!' })

  const email = body.email?.trim() ? normalizeEmail(body.email) : null
  const whatsappDigits = body.whatsapp?.trim() ? toWaNumber(body.whatsapp) : null

  if (!email && !whatsappDigits) {
    return NextResponse.json({ message: 'Informe seu e-mail ou WhatsApp.' }, { status: 400 })
  }
  // formato estrito: o valor também vai no filtro .or() do PostgREST, então nada de vírgula, parêntese ou aspas
  if (email && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
    return NextResponse.json({ message: 'Confira o e-mail.' }, { status: 400 })
  }
  if (whatsappDigits && (whatsappDigits.length < 12 || whatsappDigits.length > 15)) {
    return NextResponse.json({ message: 'Confira o WhatsApp, com DDD.' }, { status: 400 })
  }

  const origem = typeof body.origem === 'string' ? body.origem.slice(0, 200) : null
  const service = createServiceClient()

  // Quem já está inscrito por um canal e volta com o outro: completa o mesmo registro.
  const filtros = [email && `email.eq.${email}`, whatsappDigits && `whatsapp.eq.${whatsappDigits}`].filter(Boolean).join(',')
  const { data: existente } = await service.from('video_subscribers').select('id, email, whatsapp').or(filtros).limit(1).maybeSingle()

  const { error } = existente
    ? await service.from('video_subscribers')
        .update({ email: existente.email ?? email, whatsapp: existente.whatsapp ?? whatsappDigits })
        .eq('id', existente.id)
    : await service.from('video_subscribers').insert({ email, whatsapp: whatsappDigits, origem })

  if (error) {
    console.error('[inscrever]', error)
    return NextResponse.json({ message: 'Não foi possível salvar agora. Tente de novo em instantes.' }, { status: 500 })
  }
  return NextResponse.json({ message: 'Inscrição feita! Você vai receber o aviso do próximo vídeo.' })
}
