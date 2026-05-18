'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/ead'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    })
    setLoading(false)
    if (error) {
      setError('Erro ao enviar o link. Tente novamente.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1b4332]">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-[#1b4332] mb-2">
            Agricultura Sintropica
          </h1>
          <p className="text-sm text-gray-500">Plataforma de Aprendizado</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="text-lg font-semibold text-[#1b4332] mb-2">
              Verifique seu email
            </h2>
            <p className="text-sm text-gray-600">
              Enviamos um link de acesso para <strong>{email}</strong>.
              Clique no link para entrar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1b4332] text-white rounded-lg py-3 text-sm font-medium hover:bg-[#2d6a4f] transition-colors disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Entrar com link no email'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
