import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { createDownloadToken } from '@/lib/download'
import { sendDownloadEmailEn, sendDownloadEmailEs } from '@/lib/email'
import type { StripeProductId } from '@/config/products'

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const email = session.customer_details?.email
    const { productId, locale } = session.metadata as { productId: StripeProductId; locale: 'en' | 'es' }

    if (!email || !productId) {
      console.error('Stripe webhook: missing email or productId', session.id)
      return NextResponse.json({ ok: true })
    }

    try {
      await grantAccessAndSendEmail(email, productId, session.id, locale)
    } catch (err) {
      console.error('Stripe post-payment error:', err)
    }
  }

  return NextResponse.json({ ok: true })
}

async function grantAccessAndSendEmail(
  email: string,
  productId: StripeProductId,
  paymentId: string,
  locale: 'en' | 'es',
) {
  const supabase = await createServiceClient()

  let userId: string | null = null
  try {
    const { data: users } = await supabase.auth.admin.listUsers()
    userId = users?.users?.find(u => u.email === email)?.id ?? null
    if (!userId) {
      const { data: newUser } = await supabase.auth.admin.createUser({ email, email_confirm: true })
      userId = newUser?.user?.id ?? null
    }
    if (userId) {
      await supabase.from('user_products').upsert(
        { user_id: userId, product: productId, asaas_payment_id: paymentId },
        { onConflict: 'user_id,product' }
      )
    }
  } catch (err) {
    console.error('Stripe webhook: error registering user:', err)
  }

  if (productId === 'ebook' || productId === 'session') {
    const token = await createDownloadToken(email, 'ebook')
    if (locale === 'es') {
      await sendDownloadEmailEs(email, token)
    } else {
      await sendDownloadEmailEn(email, token)
    }
  }
}
