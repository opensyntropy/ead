import type { Metadata } from 'next'
import { getStripe, isStripeEnabled } from '@/lib/stripe'
import { WHATSAPP_COMMUNITY_COMPRADORES } from '@/lib/site'
import ComunidadeCompradores from '../ebook/ComunidadeCompradores'

export const metadata: Metadata = {
  title: 'Pagamento confirmado',
  robots: { index: false },
}

// O convite da comunidade de leitores só aparece com uma sessão do Stripe paga de verdade
// (a página é pública; sem isso qualquer um veria o link).
async function sessaoPaga(sessionId: string | undefined) {
  if (!sessionId || !isStripeEnabled()) return false
  try {
    const s = await getStripe().checkout.sessions.retrieve(sessionId)
    return s.payment_status === 'paid'
  } catch {
    return false
  }
}

export default async function CompraConfirmada({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams
  const paga = await sessaoPaga(session_id)
  return (
    <div className="min-h-screen bg-[#141F0C] flex items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-6">🌿</div>
        <h1 className="text-3xl font-serif font-bold text-[#7DC142] mb-4">Pagamento confirmado!</h1>
        <p className="text-white/70 text-lg leading-relaxed mb-8">
          Obrigado pela compra. Você vai receber em poucos minutos um e-mail com o link para baixar o ebook.
        </p>
        {paga && <div className="mb-8"><ComunidadeCompradores url={WHATSAPP_COMMUNITY_COMPRADORES} /></div>}
        <p className="text-white/40 text-sm">
          Não chegou? Confira a pasta de spam ou{' '}
          <a href="/reenviar" className="text-[#52b788] underline">peça um novo link</a>.
        </p>
      </div>
    </div>
  )
}
