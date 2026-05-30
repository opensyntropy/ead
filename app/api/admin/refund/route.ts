import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sendRefundEmail } from '@/lib/email'
import { refundPayment } from '@/lib/asaas'

export async function PATCH(request: Request) {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })

  const service = await createServiceClient()

  // Busca o pedido para obter email e evitar duplo processamento
  const { data: refundReq } = await service
    .from('refund_requests')
    .select('email, status')
    .eq('id', id)
    .single()

  if (!refundReq) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Estorno real apenas na primeira resolução
  if (status === 'resolved' && refundReq.status !== 'resolved') {
    const { data: charge } = await service
      .from('pix_charges')
      .select('asaas_payment_id')
      .eq('email', refundReq.email)
      .in('product', ['ebook', 'bundle', 'session', 'session_upsell'])
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Estorna na Asaas antes de marcar resolvido — se falhar, aborta sem alterar nada
    if (charge?.asaas_payment_id) {
      try {
        await refundPayment(charge.asaas_payment_id)
      } catch (err) {
        console.error('Erro ao estornar na Asaas:', err)
        return NextResponse.json({ error: `Falha ao estornar na Asaas: ${err instanceof Error ? err.message : 'erro desconhecido'}` }, { status: 502 })
      }
      await service
        .from('user_products')
        .update({ refunded: true })
        .eq('asaas_payment_id', charge.asaas_payment_id)
    }

    // Email de confirmação de estorno
    try {
      await sendRefundEmail(refundReq.email)
    } catch (err) {
      console.error('Erro ao enviar email de estorno:', err)
    }
  }

  const { error } = await service
    .from('refund_requests')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Erro interno' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
