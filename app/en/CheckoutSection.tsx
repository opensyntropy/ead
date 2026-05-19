'use client'
import { useState } from 'react'
import type { PriceTier, StripeCurrency } from '@/lib/geo'
import type { StripeProductId } from '@/config/products'
import { STRIPE_PRODUCTS } from '@/config/products'

interface Props {
  defaultTier: PriceTier
  locale: 'en' | 'es'
  currency: StripeCurrency
}

const COPY = {
  en: {
    title: 'Get your copy',
    ebook: 'Ebook',
    session: 'Ebook + 1h Session',
    sessionDesc: 'Individual consultation with Michel Bottan via video call',
    gsNote: 'Global South price — for lower-income countries',
    gnNote: 'Global North price — for higher-income countries',
    switchToGs: "I'm from a lower-income country →",
    switchToGn: "Switch to standard price →",
    btn: 'Buy now',
    loading: 'Redirecting...',
    singleUse: 'Secure payment via Stripe. After confirmation, you\'ll receive the download link by email.',
  },
  es: {
    title: 'Obtén tu copia',
    ebook: 'Ebook',
    session: 'Ebook + Sesión 1h',
    sessionDesc: 'Consulta individual con Michel Bottan por videollamada',
    gsNote: 'Precio Global South — para países de menores ingresos',
    gnNote: 'Precio Global North — para países de mayores ingresos',
    switchToGs: 'Soy de un país de menores ingresos →',
    switchToGn: 'Cambiar al precio estándar →',
    btn: 'Comprar ahora',
    loading: 'Redirigiendo...',
    singleUse: 'Pago seguro vía Stripe. Después de la confirmación, recibirás el enlace de descarga por correo.',
  },
}

export default function CheckoutSection({ defaultTier, locale, currency }: Props) {
  const [tier, setTier] = useState<PriceTier>(defaultTier)
  const [product, setProduct] = useState<StripeProductId>('ebook')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = COPY[locale]

  const price = STRIPE_PRODUCTS[product][tier][currency].label

  async function handleBuy() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product, tier, locale, currency }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error ?? 'Error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#b7e4c7] p-6 md:p-8 max-w-md w-full">
      <h3 className="text-xl font-bold text-[#1b4332] mb-6">{t.title}</h3>

      {/* Product selector */}
      <div className="flex gap-2 mb-6">
        {(['ebook', 'session'] as StripeProductId[]).map(p => (
          <button
            key={p}
            onClick={() => setProduct(p)}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium border-2 transition-colors ${
              product === p
                ? 'border-[#52b788] bg-[#f0fdf4] text-[#1b4332]'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {p === 'ebook' ? t.ebook : t.session}
          </button>
        ))}
      </div>

      {product === 'session' && (
        <p className="text-xs text-gray-400 mb-4 -mt-2">{t.sessionDesc}</p>
      )}

      {/* Price display */}
      <div className="mb-2">
        <span className="text-5xl font-bold text-[#1b4332]">{price}</span>
        <span className="text-gray-400 ml-2 text-sm">USD</span>
      </div>
      <p className="text-xs text-gray-400 mb-1">{tier === 'gs' ? t.gsNote : t.gnNote}</p>
      <button
        onClick={() => setTier(t2 => t2 === 'gn' ? 'gs' : 'gn')}
        className="text-xs text-[#52b788] hover:text-[#1b4332] underline mb-6 block"
      >
        {tier === 'gn' ? t.switchToGs : t.switchToGn}
      </button>

      {/* Buy button */}
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full bg-[#7DC142] hover:bg-[#6aaa38] text-[#141F0C] font-bold text-lg rounded-xl py-4 transition-colors disabled:opacity-60"
      >
        {loading ? t.loading : `${t.btn} — ${price}`}
      </button>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

      <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">{t.singleUse}</p>
    </div>
  )
}
