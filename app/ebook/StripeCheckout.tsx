'use client'
import { useState } from 'react'
import type { PriceTier, StripeCurrency } from '@/lib/geo'
import { track } from '@/lib/cybereco'

const LIME = '#7DC142'
const DARK = '#141F0C'

export type IntlOffer = { tier: PriceTier; currency: StripeCurrency; label: string }

// Checkout para quem está fora do Brasil: sem CPF/PIX, paga na moeda local via Stripe.
export default function StripeCheckout({ offer, onUseBr }: { offer: IntlOffer; onUseBr: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleBuy() {
    track('checkout_start', { produto: 'ebook', metodo: 'stripe', currency: offer.currency })
    setLoading(true)
    setError('')
    const utm = (() => { try { return JSON.parse(sessionStorage.getItem('utm') ?? '{}') } catch { return {} } })()
    const getCookie = (name: string) => document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='))?.split('=').slice(1).join('=') ?? null
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')
    const fbc = getCookie('_fbc') ?? (fbclid ? `fb.1.${Date.now()}.${fbclid}` : null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'ebook', tier: offer.tier, currency: offer.currency, locale: 'pt',
          ...utm, fbc, fbp: getCookie('_fbp'),
        }),
      })
      const data = await res.json()
      if (data.url) {
        track('payment_created', { produto: 'ebook', metodo: 'stripe', currency: offer.currency })
        window.location.href = data.url
        return
      }
      setError('Não foi possível abrir o pagamento. Tente novamente.')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    <>
      <div className="px-8 py-7 text-center" style={{ backgroundColor: '#0D1608' }}>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Ebook Digital — PDF · +200 páginas</p>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Leia onde quiser ou imprima</p>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: LIME }}>Acesso permanente · entrega imediata</p>
        <div className="font-black leading-none" style={{ fontSize: 'clamp(3.5rem, 14vw, 6rem)', color: LIME }}>
          {offer.label}
        </div>
        <p className="text-gray-400 text-sm mt-2">pagamento único · cartão de crédito ou débito</p>
      </div>

      <div className="bg-white px-8 pt-7 pb-8 flex flex-col gap-4">
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        <button type="button" onClick={handleBuy} disabled={loading}
          className="py-5 px-8 rounded-xl font-bold text-lg transition-all disabled:opacity-60 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-100"
          style={{ backgroundColor: LIME, color: DARK }}>
          {loading ? 'Aguarde...' : `Comprar por ${offer.label} →`}
        </button>
        <p className="text-xs text-gray-400 text-center leading-relaxed -mt-1">
          Você será levado à página segura de pagamento (Stripe). Após a confirmação, o link de download chega por e-mail.
        </p>
        <button type="button" onClick={onUseBr}
          className="text-xs text-gray-400 underline hover:text-gray-600">
          Está no Brasil? Pague em reais com PIX ou cartão
        </button>

        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
          <span style={{ color: LIME }}>★★★★★</span>
          <span>Garantia de 7 dias · sem perguntas · sem burocracia</span>
        </div>
      </div>
    </>
  )
}
