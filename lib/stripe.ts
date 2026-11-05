import Stripe from 'stripe'

let _stripe: Stripe | null = null

// Ligado sempre que houver chave: sem ela o site segue só com o checkout Asaas.
export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
  }
  return _stripe
}

export async function createStripeCheckoutSession({
  price,
  successUrl,
  cancelUrl,
  metadata,
}: {
  price: { cents: number; currency: string; name: string }
  successUrl: string
  cancelUrl: string
  metadata: Record<string, string>
}) {
  return getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: price.currency,
        unit_amount: price.cents,
        product_data: { name: price.name },
      },
      quantity: 1,
    }],
    customer_email: undefined, // Stripe collects email on checkout page
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data: { metadata },
    // Telefone obrigatório no checkout; o webhook grava em pix_charges.whatsapp.
    phone_number_collection: { enabled: true },
  })
}

// Valor bruto em centavos de BRL (moeda de liquidação da conta), para os
// relatórios do admin, que somam tudo em reais. null se ainda não disponível.
export async function getSettledBrlCents(paymentIntentId: string): Promise<number | null> {
  const pi = await getStripe().paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge.balance_transaction'],
  })
  const charge = pi.latest_charge
  if (!charge || typeof charge === 'string') return null
  const bt = charge.balance_transaction
  if (!bt || typeof bt === 'string' || bt.currency !== 'brl') return null
  return bt.amount
}

export async function refundStripeCheckoutSession(sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId)
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  if (!pi) throw new Error('Sessão Stripe sem pagamento')
  return getStripe().refunds.create({ payment_intent: pi })
}
