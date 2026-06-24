'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

const EmailEditor = dynamic(() => import('./EmailEditor'), { ssr: false })

interface Props {
  buyerCount: number
}

type RecipientFilter = 'all' | 'product'

const PRODUCTS_OPTIONS = [
  { value: 'ebook', label: 'Ebook — Guia de Introdução' },
  { value: 'ebook_session', label: 'Ebook + Sessão Individual' },
]

const INITIAL_CONTENT = '<p>Olá,</p><p></p><p></p>'

export default function EmailBroadcastForm({ buyerCount }: Props) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState(INITIAL_CONTENT)
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('all')
  const [selectedProduct, setSelectedProduct] = useState('ebook')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string; sent?: number } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  const handlePreview = useCallback(async () => {
    const res = await fetch('/api/admin/send-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, filter: recipientFilter, product: selectedProduct, preview: true }),
    })
    const data = await res.json()
    setPreviewHtml(data.html ?? '')
    setShowPreview(true)
  }, [subject, body, recipientFilter, selectedProduct])

  const handleSend = useCallback(async () => {
    if (!subject.trim()) { alert('Informe o assunto do email.'); return }
    if (!body || body === INITIAL_CONTENT) { alert('Escreva o conteúdo do email.'); return }
    const confirmed = window.confirm(
      `Enviar este email para ${recipientFilter === 'all' ? `todos os ${buyerCount} compradores` : `compradores do produto selecionado`}?\n\nAssunto: ${subject}`
    )
    if (!confirmed) return

    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/send-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, filter: recipientFilter, product: selectedProduct }),
      })
      const data = await res.json()
      setResult({ ok: res.ok, message: data.message ?? (res.ok ? 'Enviado com sucesso!' : 'Erro ao enviar.'), sent: data.sent })
    } catch {
      setResult({ ok: false, message: 'Erro de rede ao enviar.' })
    } finally {
      setSending(false)
    }
  }, [subject, body, recipientFilter, selectedProduct, buyerCount])

  return (
    <div className="max-w-3xl space-y-6">
      {/* Recipients */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-[#52b788] inline-block" />
          Destinatários
        </h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRecipientFilter('all')}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors text-left ${recipientFilter === 'all' ? 'border-[#52b788] bg-[#f0fdf4] text-[#1b4332]' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
          >
            <div className="font-semibold">Todos os compradores</div>
            <div className="text-xs mt-0.5 text-gray-500">{buyerCount} compradores com acesso pago</div>
          </button>
          <button
            type="button"
            onClick={() => setRecipientFilter('product')}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors text-left ${recipientFilter === 'product' ? 'border-[#52b788] bg-[#f0fdf4] text-[#1b4332]' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
          >
            <div className="font-semibold">Filtrar por produto</div>
            <div className="text-xs mt-0.5 text-gray-500">Selecionar um produto específico</div>
          </button>
        </div>
        {recipientFilter === 'product' && (
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#52b788]"
          >
            {PRODUCTS_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Subject */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-[#52b788] inline-block" />
          Assunto
        </h2>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Ex: Uma novidade para você..."
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#52b788] transition-colors"
        />
      </div>

      {/* Body */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-[#52b788] inline-block" />
          Conteúdo do email
        </h2>
        <p className="text-xs text-gray-400">
          O texto será inserido no template padrão OpenSyntropy. Use negrito, links e imagens à vontade.
        </p>
        <EmailEditor content={INITIAL_CONTENT} onChange={setBody} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={!subject || sending}
          className="px-5 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Pré-visualizar
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !subject}
          className="px-6 py-2.5 text-sm font-bold bg-[#1b4332] text-white rounded-lg hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar email'
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border p-4 text-sm font-medium ${result.ok ? 'bg-[#f0fdf4] border-[#52b788] text-[#1b4332]' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {result.message}
          {result.sent != null && result.ok && (
            <span className="ml-2 text-gray-500 font-normal">({result.sent} email{result.sent !== 1 ? 's' : ''} enviado{result.sent !== 1 ? 's' : ''})</span>
          )}
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800">Pré-visualização do email</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-4">
              <div className="text-xs text-gray-400 mb-2 px-2">Assunto: <span className="text-gray-700 font-medium">{subject}</span></div>
              <iframe
                srcDoc={previewHtml}
                className="w-full rounded-lg border border-gray-100"
                style={{ height: 600 }}
                title="Email preview"
              />
            </div>
            <div className="px-6 pb-4 flex justify-end">
              <button onClick={() => setShowPreview(false)} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
