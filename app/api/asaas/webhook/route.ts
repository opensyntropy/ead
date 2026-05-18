import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createDownloadToken } from '@/lib/download'
import { sendDownloadEmail } from '@/lib/email'
import type { ProductId } from '@/config/products'

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

  const validProducts: ProductId[] = ['ebook', 'course', 'bundle']
  if (!validProducts.includes(productId as ProductId)) {
    console.error('Webhook: produto desconhecido', productId)
    return NextResponse.json({ ok: true })
  }

  const supabase = await createServiceClient()

  // Garante que o usuário existe no Supabase Auth
  const { data: users } = await supabase.auth.admin.listUsers()
  let userId: string | null = users.users.find(u => u.email === email)?.id ?? null

  if (!userId) {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    })
    if (error || !newUser.user) {
      console.error('Webhook: erro ao criar usuário', error)
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }
    userId = newUser.user.id
  }

  // Insere o produto (ignora duplicatas via upsert)
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

  // Envia e-mail com link de download para produtos que incluam ebook
  if (productId === 'ebook' || productId === 'bundle') {
    try {
      const token = await createDownloadToken(email, 'ebook')
      await sendDownloadEmail(email, token)
    } catch (emailErr) {
      console.error('Webhook: erro ao enviar e-mail', emailErr)
    }
  }

  console.log(`Acesso liberado: ${email} → ${productId}`)
  return NextResponse.json({ ok: true })
}
