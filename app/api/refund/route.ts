import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { email, reason } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('refund_requests')
    .insert({ email: email.toLowerCase().trim(), reason: reason ?? null })

  if (error) {
    console.error('refund insert error', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
