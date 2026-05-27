import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sendRefundEmail } from '@/lib/email'

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

  const { error } = await service
    .from('refund_requests')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Erro interno' }, { status: 500 })

  // Ações adicionais apenas na primeira aprovação
  if (status === 'resolved' && refundReq.status !== 'resolved') {
    // Marca user_products.refunded = true via asaas_payment_id
    const { data: charge } = await service
      .from('pix_charges')
      .select('asaas_payment_id')
      .eq('email', refundReq.email)
      .in('product', ['ebook', 'bundle', 'session', 'session_upsell'])
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (charge) {
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

  return NextResponse.json({ ok: true })
}
