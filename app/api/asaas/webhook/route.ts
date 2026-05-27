import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createDownloadToken } from '@/lib/download'
import { sendDownloadEmail, sendSessionPurchaseEmail, sendPurchaseNotification } from '@/lib/email'
import { PRODUCTS } from '@/config/products'
import type { ProductId } from '@/config/products'
import { sendPurchaseEvent } from '@/lib/meta-pixel'

export const maxDuration = 60

// Asaas envia um token no header ou query param para validação
function validateWebhook(request: Request): boolean {
  const token = request.headers.get('asaas-access-token')
    ?? new URL(request.url).searchParams.get('token')
  return token === process.env.ASAAS_WEBHOOK_TOKEN
}

export async function POST(request: Request) {
  if (!validateWebhook(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const event = await request.json()

  // Só processa quando pagamento é confirmado
  if (!['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(event.event)) {
    return NextResponse.json({ ok: true })
  }

  const payment = event.payment
  // externalReference = "productId:email"
  const ref: string = payment?.externalReference ?? ''
  const [productId, email] = ref.split(':')

  if (!productId || !email) {
    console.error('Webhook: externalReference inválido', ref)
    return NextResponse.json({ ok: true })
  }

  const validProducts: ProductId[] = ['ebook', 'course', 'bundle', 'session', 'session_upsell']
  if (!validProducts.includes(productId as ProductId)) {
    console.error('Webhook: produto desconhecido', productId)
    return NextResponse.json({ ok: true })
  }

  const supabase = await createServiceClient()

  // Garante que o usuário existe no Supabase Auth
  let userId: string | null = null
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (createError) {
    // Usuário já existe — busca via listUsers
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    userId = list?.users?.find(u => u.email === email)?.id ?? null
    if (!userId) {
      // Continua mesmo sem userId — acesso pelo EAD ficará pendente, mas email será enviado
      console.warn('Webhook: usuário não encontrado via listUsers, prosseguindo sem userId')
    }
  } else {
    userId = newUser.user?.id ?? null
  }

  // Insere o produto (ignora duplicatas via upsert)
  if (userId) {
    const { error: upsertError } = await supabase
      .from('user_products')
      .upsert(
        { user_id: userId, product: productId, asaas_payment_id: payment.id },
        { onConflict: 'user_id,product' }
      )
    if (upsertError) {
      console.error('Webhook: erro ao inserir user_products', upsertError)
      return NextResponse.json({ error: 'Erro ao registrar acesso' }, { status: 500 })
    }
  }

  // Marca como confirmado apenas se ainda não estava (guard de idempotência)
  // Protege contra PAYMENT_RECEIVED + PAYMENT_CONFIRMED chegarem para o mesmo pagamento
  const { data: updated } = await supabase.from('pix_charges')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('asaas_payment_id', payment.id)
    .is('confirmed_at', null)
    .select('id')

  const isFirstConfirmation = (updated?.length ?? 0) > 0

  if (isFirstConfirmation) {
    // Envia e-mail com link de download para produtos que incluam ebook
    if (productId === 'ebook' || productId === 'bundle') {
      try {
        const token = await createDownloadToken(email, 'ebook')
        await sendDownloadEmail(email, token)
      } catch (emailErr) {
        console.error('Webhook: erro ao enviar e-mail', emailErr)
      }
    }
    if (productId === 'session' || productId === 'session_upsell') {
      try {
        const token = await createDownloadToken(email, 'ebook')
        await sendSessionPurchaseEmail(email, token)
      } catch (emailErr) {
        console.error('Webhook: erro ao enviar e-mail de sessão', emailErr)
      }
    }

    try {
      await sendPurchaseNotification(email, productId, payment.id)
    } catch (err) {
      console.error('Webhook: erro ao enviar notificação de venda', err)
    }

    // Meta Conversions API — dispara Purchase server-side uma única vez
    try {
      const value = (PRODUCTS[productId as ProductId]?.price ?? 6700) / 100
      await sendPurchaseEvent({ email, value, eventId: payment.id })
    } catch (err) {
      console.error('Webhook: erro CAPI', err)
    }
  }

  console.log(`Acesso liberado: ${email} → ${productId}${isFirstConfirmation ? '' : ' (já processado)'}`)
  return NextResponse.json({ ok: true })
}
