import { NextResponse } from 'next/server'
import { createStripeCheckoutSession } from '@/lib/stripe'
import { STRIPE_PRODUCTS, type StripeProductId } from '@/config/products'
import type { PriceTier, StripeCurrency } from '@/lib/geo'

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ead.opensyntropy.earth').replace(/\/$/, '')

export async function POST(request: Request) {
  const { productId, tier, locale, currency = 'usd' } = await request.json() as {
    productId: StripeProductId
    tier: PriceTier
    locale: 'en' | 'es'
    currency?: StripeCurrency
  }

  const product = STRIPE_PRODUCTS[productId]
  if (!product) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
  }

  const priceId = product[tier][currency].priceId
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 })
  }

  try {
    const session = await createStripeCheckoutSession({
      priceId,
      successUrl: `${BASE_URL}/${locale}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${BASE_URL}/${locale}`,
      metadata: { productId, tier, locale },
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Stripe checkout error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
