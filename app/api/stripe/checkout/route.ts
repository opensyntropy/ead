import { NextResponse } from 'next/server'
import { createStripeCheckoutSession } from '@/lib/stripe'
import { STRIPE_PRODUCTS, STRIPE_EBOOK_PT_EUR, STRIPE_EBOOK_PT_NAME, type StripeProductId } from '@/config/products'
import type { PriceTier, StripeCurrency } from '@/lib/geo'

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ead.opensyntropy.earth').replace(/\/$/, '')

// Atribuição repassada ao webhook via metadata (limite Stripe: 500 chars por valor).
const TRACKING_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbc', 'fbp'] as const

export async function POST(request: Request) {
  const body = await request.json() as {
    productId: StripeProductId
    tier: PriceTier
    locale: 'en' | 'es' | 'pt'
    currency?: StripeCurrency
  } & Partial<Record<typeof TRACKING_KEYS[number], string | null>>
  const { productId, tier, locale, currency = 'usd' } = body

  const product = STRIPE_PRODUCTS[productId]
  if (!product) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
  }

  const tierPrice = product[tier]?.[currency]
  if (!tierPrice) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }
  const isPtEbook = locale === 'pt' && productId === 'ebook' && currency === 'eur'
  const { cents, currency: chargeCurrency } = isPtEbook ? STRIPE_EBOOK_PT_EUR : tierPrice
  const name = isPtEbook ? STRIPE_EBOOK_PT_NAME : locale === 'es' ? product.nameEs : product.name

  const metadata: Record<string, string> = { productId, tier, locale }
  for (const k of TRACKING_KEYS) {
    const v = body[k]
    if (typeof v === 'string' && v) metadata[k] = v.slice(0, 500)
  }

  // Comprador lusófono compra pela landing /guia-agrofloresta (PT); en/es têm páginas próprias.
  const successUrl = locale === 'pt'
    ? `${BASE_URL}/compra-confirmada?session_id={CHECKOUT_SESSION_ID}`
    : `${BASE_URL}/${locale}/sucesso?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = locale === 'pt' ? `${BASE_URL}/guia-agrofloresta#comprar` : `${BASE_URL}/${locale}`

  try {
    const session = await createStripeCheckoutSession({
      price: { cents, currency: chargeCurrency, name }, successUrl, cancelUrl, metadata,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Stripe checkout error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
