'use client'
import { useState } from 'react'

interface Props {
  mode?: 'add' | 'resolve-refund' | 'confirm-pix'
  id?: string
  email?: string
  product?: string
  userId?: string
  status?: string
}

export default function AdminActions({ mode, id, email, product, userId, status }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Form state for manual add
  const [newEmail, setNewEmail] = useState('')
  const [newProduct, setNewProduct] = useState<'ebook' | 'course' | 'bundle'>('ebook')

  async function handleRevoke() {
    if (!confirm(`Revogar acesso "${product}" de ${email}?`)) return
    setLoading(true)
    const res = await fetch('/api/admin/access', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLoading(false)
    if (res.ok) { setDone(true); window.location.reload() }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, product: newProduct }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      if (data.emailError) alert(`Acesso concedido, mas erro no email: ${data.emailError}`)
      setNewEmail('')
      window.location.reload()
    }
  }

  async function handleResolveRefund() {
    if (!confirm('Marcar este pedido como resolvido?')) return
    setLoading(true)
    const res = await fetch('/api/admin/refund', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'resolved' }),
    })
    setLoading(false)
    if (res.ok) window.location.reload()
  }

  async function handleConfirmPix() {
    if (!confirm('Confirmar pagamento e liberar acesso + enviar email?')) return
    setLoading(true)
    const res = await fetch('/api/admin/pix-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pixChargeId: id }),
    })
    setLoading(false)
    if (res.ok) { setDone(true); window.location.reload() }
    else alert('Erro ao confirmar. Tente novamente.')
  }

  if (mode === 'confirm-pix') {
    if (done) return <span className="text-xs text-green-600">Confirmado ✓</span>
    return (
      <button
        onClick={handleConfirmPix}
        disabled={loading}
        className="text-xs text-yellow-700 hover:text-yellow-900 font-medium disabled:opacity-50"
      >
        {loading ? '...' : 'Confirmar + enviar email'}
      </button>
    )
  }

  if (mode === 'resolve-refund') {
    if (status === 'resolved') return <span className="text-xs text-gray-400">Resolvido</span>
    return (
      <button
        onClick={handleResolveRefund}
        disabled={loading}
        className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
      >
        {loading ? '...' : 'Marcar resolvido'}
      </button>
    )
  }

  if (mode === 'add') {
    return (
      <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input
            type="email"
            required
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="aluno@email.com"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Produto</label>
          <select
            value={newProduct}
            onChange={e => setNewProduct(e.target.value as typeof newProduct)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
          >
            <option value="ebook">Ebook</option>
            <option value="course">Curso</option>
            <option value="bundle">Bundle</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1b4332] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#2d6a4f] disabled:opacity-60"
        >
          {loading ? '...' : 'Adicionar'}
        </button>
      </form>
    )
  }

  if (done) return <span className="text-xs text-gray-400">Revogado</span>

  return (
    <button
      onClick={handleRevoke}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? '...' : 'Revogar'}
    </button>
  )
}
