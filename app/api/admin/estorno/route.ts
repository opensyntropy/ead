import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sendRefundEmail } from '@/lib/email'
import { refundPayment } from '@/lib/asaas'

// Estorno direto de um cliente a partir da lista de acessos.
export async function POST(request: Request) {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentId, email } = await request.json()
  if (!paymentId) return NextResponse.json({ error: 'Pagamento sem ID Asaas — não é possível estornar.' }, { status: 400 })

  const service = await createServiceClient()

  // Estorna na Asaas antes de revogar — se falhar, aborta sem alterar nada
  try {
    await refundPayment(paymentId)
  } catch (err) {
    console.error('Erro ao estornar na Asaas:', err)
    return NextResponse.json({ error: `Falha ao estornar na Asaas: ${err instanceof Error ? err.message : 'erro desconhecido'}` }, { status: 502 })
  }

  await service
    .from('user_products')
    .update({ refunded: true })
    .eq('asaas_payment_id', paymentId)

  if (email) {
    try {
      await sendRefundEmail(email)
    } catch (err) {
      console.error('Erro ao enviar email de estorno:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
