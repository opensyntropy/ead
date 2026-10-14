import { refundPayment } from '@/lib/asaas'
import { refundStripeCheckoutSession } from '@/lib/stripe'

// pix_charges.asaas_payment_id guarda também o id da sessão Stripe (cs_...).
export async function refundAnyPayment(paymentId: string) {
  if (paymentId.startsWith('cs_')) return refundStripeCheckoutSession(paymentId)
  return refundPayment(paymentId)
}
