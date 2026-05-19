import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createDownloadToken } from '@/lib/download'
import { sendDownloadEmail, sendSessionPurchaseEmail, sendPurchaseNotification } from '@/lib/email'
import { NextResponse } from 'next/server'
import type { ProductId } from '@/config/products'

async function checkAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).single()
  return !!data
}

export async function POST(request: Request) {
  // Aceita autenticação via cookie de sessão admin (mesmo padrão do painel)
  const { cookies } = await import('next/headers')
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { pixChargeId } = await request.json() as { pixChargeId: string }
  if (!pixChargeId) return NextResponse.json({ error: 'pixChargeId obrigatório' }, { status: 400 })

  const supabase = await createServiceClient()

  const { data: charge } = await supabase
    .from('pix_charges')
    .select('*')
    .eq('id', pixChargeId)
    .single()

  if (!charge) return NextResponse.json({ error: 'PIX não encontrado' }, { status: 404 })
  if (charge.status === 'confirmed') return NextResponse.json({ error: 'Já confirmado' }, { status: 400 })

  const { email, product } = charge

  // Cria ou encontra usuário
  let userId: string | null = null
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({ email, email_confirm: true })
  if (createError) {
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    userId = list?.users?.find(u => u.email === email)?.id ?? null
  } else {
    userId = newUser.user?.id ?? null
  }

  if (userId) {
    await supabase.from('user_products').upsert(
      { user_id: userId, product, asaas_payment_id: charge.asaas_payment_id },
      { onConflict: 'user_id,product' }
    )
  }

  try {
    if (product === 'ebook' || product === 'bundle') {
      const token = await createDownloadToken(email, 'ebook')
      await sendDownloadEmail(email, token)
    } else if (product === 'session' || product === 'session_upsell') {
      const token = await createDownloadToken(email, 'ebook')
      await sendSessionPurchaseEmail(email, token)
    }
  } catch (emailErr) {
    console.error('pix-confirm: erro ao enviar email ao comprador:', emailErr)
  }

  try {
    await sendPurchaseNotification(email, product, charge.asaas_payment_id)
  } catch (notifErr) {
    console.error('pix-confirm: erro ao enviar notificação:', notifErr)
  }

  await supabase.from('pix_charges')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', pixChargeId)

  return NextResponse.json({ ok: true })
}
