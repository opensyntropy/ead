'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const LIME  = '#7DC142'
const DARK  = '#141F0C'
const CREAM = '#F2F0E9'

type Status = 'idle' | 'loading' | 'done' | 'error'

function DescadastroForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get('e') ?? ''
  const token = searchParams.get('t') ?? ''
  const [status, setStatus] = useState<Status>('idle')

  async function confirm() {
    setStatus('loading')
    const res = await fetch(`/api/unsubscribe?e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`, { method: 'POST' })
    setStatus(res.ok ? 'done' : 'error')
  }

  return (
    <main style={{ backgroundColor: CREAM }} className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center font-sans">
        <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: LIME }}>OpenSyntropy</p>

        {!email || !token ? (
          <p className="text-gray-700">Link inválido. Use o link de descadastro que veio no email.</p>
        ) : status === 'done' ? (
          <>
            <h1 className="text-xl font-bold mb-3" style={{ color: DARK }}>Pronto, descadastrado</h1>
            <p className="text-gray-600 text-sm">
              <strong>{email}</strong> não vai mais receber nossos comunicados. Emails sobre as suas compras continuam chegando normalmente.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-3" style={{ color: DARK }}>Não quer mais receber nossos emails?</h1>
            <p className="text-gray-600 text-sm mb-6">
              Vamos parar de enviar comunicados para <strong>{email}</strong>.
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={status === 'loading'}
              className="w-full py-3 rounded-xl font-bold disabled:opacity-60"
              style={{ backgroundColor: LIME, color: DARK }}
            >
              {status === 'loading' ? 'Descadastrando...' : 'Confirmar descadastro'}
            </button>
            {status === 'error' && (
              <p className="text-red-700 text-sm mt-4">Não foi possível descadastrar. Tente novamente mais tarde.</p>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default function DescadastroPage() {
  return (
    <Suspense>
      <DescadastroForm />
    </Suspense>
  )
}
