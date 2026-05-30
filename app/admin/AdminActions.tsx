'use client'
import { useState } from 'react'

interface Props {
  mode?: 'add' | 'resolve-refund' | 'confirm-pix' | 'resend-download' | 'copy-link' | 'copy-pix' | 'estorno'
  id?: string
  email?: string
  product?: string
  userId?: string
  status?: string
  pixPayload?: string
  paymentId?: string
}

export default function AdminActions({ mode, id, email, product, userId, status, pixPayload, paymentId }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Form state for manual add
  const [newEmail, setNewEmail] = useState('')
  const [newProduct, setNewProduct] = useState<'ebook' | 'course' | 'bundle'>('ebook')
  const [manualPaid, setManualPaid] = useState(false)

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
      body: JSON.stringify({ email: newEmail, product: newProduct, manual_paid: manualPaid }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      if (data.emailError) alert(`Acesso concedido, mas erro no email: ${data.emailError}`)
      setNewEmail('')
      setManualPaid(false)
      window.location.reload()
    }
  }

  async function handleResolveRefund() {
    if (!confirm(`Estornar o pagamento de ${email} na Asaas?\n\nIsso devolve o valor ao cliente, revoga o acesso, envia email e marca o pedido como resolvido.`)) return
    setLoading(true)
    const res = await fetch('/api/admin/refund', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'resolved' }),
    })
    setLoading(false)
    if (res.ok) window.location.reload()
    else { const d = await res.json().catch(() => ({})); alert(d.error || 'Erro ao estornar.') }
  }

  async function handleEstorno() {
    if (!confirm(`Estornar o pagamento de ${email} na Asaas?\n\nIsso devolve o valor ao cliente, revoga o acesso e envia email de confirmação.`)) return
    setLoading(true)
    const res = await fetch('/api/admin/estorno', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, email }),
    })
    setLoading(false)
    if (res.ok) { setDone(true); window.location.reload() }
    else { const d = await res.json().catch(() => ({})); alert(d.error || 'Erro ao estornar.') }
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

  async function handleResendDownload() {
    if (!confirm(`Reenviar link de download para ${email}?`)) return
    setLoading(true)
    const res = await fetch('/api/admin/resend-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, product }),
    })
    setLoading(false)
    if (res.ok) setDone(true)
    else alert('Erro ao reenviar. Tente novamente.')
  }

  if (mode === 'copy-pix') {
    if (done) return <span className="text-xs text-green-600 font-medium">Copiado ✓</span>
    if (!pixPayload) return <span className="text-xs text-gray-300">—</span>
    return (
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(pixPayload)
          } catch {
            const el = document.createElement('textarea')
            el.value = pixPayload
            el.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
            document.body.appendChild(el)
            el.focus()
            el.select()
            document.execCommand('copy')
            document.body.removeChild(el)
          }
          setDone(true)
          setTimeout(() => setDone(false), 3000)
        }}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
        title="Copiar código PIX copia e cola"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copiar PIX
      </button>
    )
  }

  if (mode === 'copy-link') {
    if (done) return <span className="text-xs text-green-600 font-medium">Copiado ✓</span>
    return (
      <button
        onClick={async () => {
          setLoading(true)
          const res = await fetch('/api/admin/generate-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })
          const data = await res.json()
          setLoading(false)
          if (res.ok && data.url) {
            await navigator.clipboard.writeText(data.url)
            setDone(true)
            setTimeout(() => setDone(false), 3000)
          } else {
            alert('Erro ao gerar link.')
          }
        }}
        disabled={loading}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 disabled:opacity-40 transition-colors"
        title={`Copiar link de download de ${email}`}
      >
        {loading
          ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        }
        Copiar link
      </button>
    )
  }

  if (mode === 'resend-download') {
    if (done) return <span className="text-xs text-green-600 font-medium">Enviado ✓</span>
    return (
      <button
        onClick={handleResendDownload}
        disabled={loading}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 disabled:opacity-40 transition-colors"
        title={`Reenviar link de download para ${email}`}
      >
        {loading
          ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        }
        Reenviar link
      </button>
    )
  }

  if (mode === 'confirm-pix') {
    if (done) return <span className="text-sm text-green-600 font-medium">Confirmado ✓</span>
    return (
      <button
        onClick={handleConfirmPix}
        disabled={loading}
        className="text-sm text-yellow-700 hover:text-yellow-900 font-semibold disabled:opacity-50"
      >
        {loading ? '...' : 'Confirmar + enviar email'}
      </button>
    )
  }

  if (mode === 'resolve-refund') {
    if (status === 'resolved') return <span className="text-sm text-gray-400">Estornado</span>
    return (
      <button
        onClick={handleResolveRefund}
        disabled={loading}
        className="text-sm text-red-600 hover:text-red-800 font-semibold disabled:opacity-50"
      >
        {loading ? '...' : 'Estornar'}
      </button>
    )
  }

  if (mode === 'estorno') {
    if (done) return <span className="text-xs text-green-600 font-medium">Estornado ✓</span>
    return (
      <button
        onClick={handleEstorno}
        disabled={loading}
        title={`Estornar pagamento de ${email} na Asaas`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 disabled:opacity-40 transition-colors"
      >
        {loading
          ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
        }
        Estornar
      </button>
    )
  }

  if (mode === 'add') {
    return (
      <form onSubmit={handleAdd} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
          <input
            type="email"
            required
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="aluno@email.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#52b788]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">Produto</label>
          <select
            value={newProduct}
            onChange={e => setNewProduct(e.target.value as typeof newProduct)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#52b788]"
          >
            <option value="ebook">Ebook</option>
            <option value="course">Curso</option>
            <option value="bundle">Bundle</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">Tipo de acesso</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setManualPaid(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                !manualPaid
                  ? 'bg-gray-100 border-gray-400 text-gray-700'
                  : 'border-gray-200 text-gray-400 hover:bg-gray-50'
              }`}
            >
              Cortesia
            </button>
            <button
              type="button"
              onClick={() => setManualPaid(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                manualPaid
                  ? 'bg-[#d8f3dc] border-[#52b788] text-[#1b4332]'
                  : 'border-gray-200 text-gray-400 hover:bg-gray-50'
              }`}
            >
              Pago
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1b4332] text-white rounded-lg px-4 py-3 text-base font-semibold hover:bg-[#2d6a4f] disabled:opacity-60 transition-colors"
        >
          {loading ? '...' : 'Adicionar acesso'}
        </button>
      </form>
    )
  }

  if (done) return <span className="text-xs text-gray-400 italic">Revogado</span>

  return (
    <button
      onClick={handleRevoke}
      disabled={loading}
      title={`Revogar acesso "${product}" de ${email}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-40 transition-colors"
    >
      {loading
        ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
        : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      }
      Revogar
    </button>
  )
}
