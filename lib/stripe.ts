import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-04-22.dahlia',
})

export async function createStripeCheckoutSession({
  priceId,
  successUrl,
  cancelUrl,
  metadata,
}: {
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata: Record<string, string>
}) {
  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: undefined, // Stripe collects email on checkout page
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data: { metadata },
  })
}
