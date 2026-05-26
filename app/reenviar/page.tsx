'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const LIME  = '#7DC142'
const DARK  = '#141F0C'
const CREAM = '#F2F0E9'

const ERROS: Record<string, string> = {
  'token-usado':    'Este link já foi utilizado. Solicite um novo link abaixo.',
  'token-esgotado': 'Este link atingiu o limite de downloads. Solicite um novo link abaixo.',
  'token-invalido': 'Link inválido ou expirado. Solicite um novo link abaixo.',
  'sem-token':      'Nenhum link informado. Solicite um novo link abaixo.',
}

function ReenviarForm() {
  const searchParams = useSearchParams()
  const erro = searchParams.get('erro')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/resend-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <main style={{ backgroundColor: CREAM }} className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">

        <p className="text-center text-sm font-sans font-bold tracking-widest uppercase mb-3" style={{ color: LIME }}>
          OpenSyntropy
        </p>
        <h1 className="text-center font-serif text-3xl font-bold mb-2" style={{ color: DARK }}>
          Solicitar novo link
        </h1>
        <p className="text-center text-stone-500 text-base mb-10 leading-relaxed">
          Receba um novo link de download no seu e-mail de compra.
        </p>

        {erro && ERROS[erro] && (
          <div className="mb-6 px-5 py-4 rounded-xl text-sm leading-relaxed"
            style={{ backgroundColor: '#fef3c7', border: '1.5px solid #f59e0b', color: '#92400e' }}>
            {ERROS[erro]}
          </div>
        )}

        {sent ? (
          <div className="px-6 py-8 rounded-2xl text-center" style={{ backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0' }}>
            <p className="text-2xl mb-3">✓</p>
            <p className="font-bold text-lg mb-2" style={{ color: DARK }}>Verifique seu e-mail</p>
            <p className="text-stone-500 text-sm leading-relaxed">
              Se o e-mail informado estiver cadastrado em uma compra, você receberá um novo link em instantes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="E-mail usado na compra"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="border-2 border-stone-200 rounded-xl px-5 py-4 text-base bg-white focus:outline-none focus:border-[#7DC142] transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="py-4 rounded-xl font-bold text-base transition-all disabled:opacity-60"
              style={{ backgroundColor: LIME, color: DARK }}>
              {loading ? 'Aguarde...' : 'Enviar novo link'}
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

export default function ReenviarPage() {
  return (
    <Suspense>
      <ReenviarForm />
    </Suspense>
  )
}
