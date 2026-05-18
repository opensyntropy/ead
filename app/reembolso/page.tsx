'use client'
import { useState } from 'react'

const LIME  = '#7DC142'
const DARK  = '#141F0C'
const CREAM = '#F2F0E9'

export default function ReembolsoPage() {
  const [email, setEmail]   = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, reason }),
    })
    setLoading(false)
    if (res.ok) {
      setSent(true)
    } else {
      setError('Ocorreu um erro. Tente novamente.')
    }
  }

  return (
    <main style={{ backgroundColor: CREAM }} className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">

        <p className="text-center text-sm font-bold tracking-widest uppercase mb-3" style={{ color: LIME }}>
          OpenSyntropy
        </p>
        <h1 className="text-center font-serif text-3xl font-bold mb-2" style={{ color: DARK }}>
          Solicitar devolução
        </h1>
        <p className="text-center text-stone-500 text-base mb-10 leading-relaxed">
          Garantia de 7 dias sem burocracia. Preencha abaixo e entraremos em contato em até 24h.
        </p>

        {sent ? (
          <div className="px-6 py-8 rounded-2xl text-center" style={{ backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0' }}>
            <p className="text-2xl mb-3">✓</p>
            <p className="font-bold text-lg mb-2" style={{ color: DARK }}>Pedido recebido</p>
            <p className="text-stone-500 text-sm leading-relaxed">
              Recebemos seu pedido de devolução. Entraremos em contato no e-mail informado em até 24 horas.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-stone-600">E-mail usado na compra</label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border-2 border-stone-200 rounded-xl px-5 py-4 text-base bg-white focus:outline-none focus:border-[#7DC142] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-stone-600">Motivo (opcional)</label>
              <textarea
                rows={4}
                placeholder="Conte o que aconteceu..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="border-2 border-stone-200 rounded-xl px-5 py-4 text-base bg-white focus:outline-none focus:border-[#7DC142] transition-colors resize-none"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="py-4 rounded-xl font-bold text-base transition-all disabled:opacity-60"
              style={{ backgroundColor: DARK, color: '#fff' }}>
              {loading ? 'Enviando...' : 'Solicitar devolução'}
            </button>
          </form>
        )}

        <p className="text-center mt-8 text-sm text-stone-400">
          <a href="/" className="underline hover:text-stone-600 transition-colors">← Voltar ao site</a>
        </p>
      </div>
    </main>
  )
}
