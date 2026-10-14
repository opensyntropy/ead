import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, getSettledBrlCents } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { createDownloadToken } from '@/lib/download'
import {
  sendDownloadEmail, sendDownloadEmailEn, sendDownloadEmailEs,
  sendSessionPurchaseEmail, sendPurchaseNotification,
} from '@/lib/email'
import { sendPurchaseEvent } from '@/lib/meta-pixel'
import type { StripeProductId } from '@/config/products'

type Locale = 'en' | 'es' | 'pt'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Stripe webhook signature error:', msg)
    return new NextResponse(`Webhook error: ${msg}`, { status: 400 })
  }

  // Métodos assíncronos (ex.: Multibanco) chegam em completed com payment_status
  // 'unpaid' e só são pagos depois, em async_payment_succeeded.
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object
    if (session.payment_status !== 'paid') return NextResponse.json({ ok: true })

    try {
      await fulfill(session)
    } catch (err) {
      console.error('Stripe post-payment error:', err)
    }
  }

  return NextResponse.json({ ok: true })
}

async function fulfill(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email
  const meta = (session.metadata ?? {}) as Record<string, string | undefined>
  const productId = meta.productId as StripeProductId | undefined
  const locale = (meta.locale ?? 'en') as Locale

  if (!email || !productId) {
    console.error('Stripe webhook: missing email or productId', session.id)
    return
  }

  const supabase = await createServiceClient()
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  const brlCents = paymentIntentId ? await getSettledBrlCents(paymentIntentId).catch(() => null) : null

  // Registra a venda no admin. O insert serve de trava de idempotência: o Stripe
  // reentrega webhooks, e uma segunda entrega bate na unique de asaas_payment_id.
  const now = new Date().toISOString()
  const { error: insertErr } = await supabase.from('pix_charges').insert({
    asaas_payment_id: session.id, email, name: session.customer_details?.name ?? email.split('@')[0],
    product: productId, status: 'confirmed', confirmed_at: now, payment_method: 'stripe',
    value: brlCents,
    whatsapp: session.customer_details?.phone ?? null,
    utm_source: meta.utm_source ?? null, utm_medium: meta.utm_medium ?? null,
    utm_campaign: meta.utm_campaign ?? null, utm_term: meta.utm_term ?? null,
    utm_content: meta.utm_content ?? null,
    fbc: meta.fbc ?? null, fbp: meta.fbp ?? null,
  })
  if (insertErr?.code === '23505') return // já processado
  if (insertErr) console.error('Stripe webhook: pix_charges insert error:', JSON.stringify(insertErr))

  try {
    const { data: users } = await supabase.auth.admin.listUsers()
    let userId = users?.users?.find(u => u.email === email)?.id ?? null
    if (!userId) {
      const { data: newUser } = await supabase.auth.admin.createUser({ email, email_confirm: true })
      userId = newUser?.user?.id ?? null
    }
    if (userId) {
      await supabase.from('user_products').upsert(
        { user_id: userId, product: productId, asaas_payment_id: session.id },
        { onConflict: 'user_id,product' }
      )
    }
  } catch (err) {
    console.error('Stripe webhook: error registering user:', err)
  }

  try {
    await sendPurchaseEvent({
      email,
      value: (session.amount_total ?? 0) / 100,
      currency: (session.currency ?? 'eur').toUpperCase(),
      eventId: session.id,
      fbc: meta.fbc ?? null, fbp: meta.fbp ?? null,
    })
  } catch (err) {
    console.error('Stripe webhook: CAPI error:', err)
  }

  try {
    await sendPurchaseNotification(email, productId, session.id)
  } catch (err) {
    console.error('Stripe webhook: notification error:', err)
  }

  if (locale === 'pt') {
    const token = await createDownloadToken(email, 'ebook')
    if (productId === 'session') await sendSessionPurchaseEmail(email, token)
    else await sendDownloadEmail(email, token)
    return
  }

  // No Spanish edition yet: es buyers keep the Portuguese PDF
  const token = await createDownloadToken(email, 'ebook', { lang: locale === 'es' ? 'pt' : 'en' })
  if (locale === 'es') {
    await sendDownloadEmailEs(email, token)
  } else {
    await sendDownloadEmailEn(email, token)
  }
}
