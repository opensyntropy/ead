'use client'
import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { buildEmailHtml, isFullHtmlDocument } from '@/lib/broadcast-template'

const EmailEditor = dynamic(() => import('./EmailEditor'), { ssr: false })

interface Props {
  buyerCount: number
}

type RecipientFilter = 'all' | 'product'
type ContentMode = 'editor' | 'html'

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
  const [mode, setMode] = useState<ContentMode>('editor')
  const [htmlSource, setHtmlSource] = useState('')
  const [useTemplate, setUseTemplate] = useState(true)
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const content = mode === 'editor' ? body : htmlSource
  const wrap = mode === 'editor' || useTemplate
  const isEmpty = mode === 'editor' ? (!body || body === INITIAL_CONTENT) : !htmlSource.trim()

  const previewHtml = useMemo(
    () => (wrap ? buildEmailHtml(subject || '(sem assunto)', content) : content),
    [wrap, subject, content],
  )

  const switchMode = useCallback((next: ContentMode) => {
    if (next === 'html' && !htmlSource.trim() && body !== INITIAL_CONTENT) setHtmlSource(body)
    setMode(next)
  }, [htmlSource, body])

  const handleHtmlChange = useCallback((value: string) => {
    // Pasted a complete document: it already has its own layout, so don't wrap it
    if (!htmlSource.trim() && isFullHtmlDocument(value)) setUseTemplate(false)
    setHtmlSource(value)
  }, [htmlSource])

  const handleTestSend = useCallback(async () => {
    if (!subject.trim()) { alert('Informe o assunto do email.'); return }
    if (isEmpty) { alert('Escreva o conteúdo do email.'); return }
    if (!testEmail.trim()) { alert('Informe o email de teste.'); return }

    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/send-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body: content, useTemplate: wrap, testTo: testEmail }),
      })
      const data = await res.json()
      setTestResult({ ok: res.ok, message: data.message ?? (res.ok ? 'Teste enviado!' : 'Erro ao enviar teste.') })
    } catch {
      setTestResult({ ok: false, message: 'Erro de rede ao enviar teste.' })
    } finally {
      setTesting(false)
    }
  }, [subject, content, wrap, testEmail, isEmpty])

  const handleSend = useCallback(async () => {
    if (!subject.trim()) { alert('Informe o assunto do email.'); return }
    if (isEmpty) { alert('Escreva o conteúdo do email.'); return }
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
        body: JSON.stringify({ subject, body: content, useTemplate: wrap, filter: recipientFilter, product: selectedProduct }),
      })
      const data = await res.json()
      setResult({ ok: res.ok, message: data.message ?? (res.ok ? 'Enviado com sucesso!' : 'Erro ao enviar.'), sent: data.sent })
    } catch {
      setResult({ ok: false, message: 'Erro de rede ao enviar.' })
    } finally {
      setSending(false)
    }
  }, [subject, content, wrap, isEmpty, recipientFilter, selectedProduct, buyerCount])

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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-[#52b788] inline-block" />
            Conteúdo do email
          </h2>
          <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs font-semibold">
            {(['editor', 'html'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`px-3 py-1.5 rounded-md transition-colors ${mode === m ? 'bg-[#1b4332] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {m === 'editor' ? 'Editor visual' : 'Colar HTML'}
              </button>
            ))}
          </div>
        </div>

        {mode === 'editor' ? (
          <>
            <p className="text-xs text-gray-400">
              O texto será inserido no template padrão OpenSyntropy. Use negrito, links e imagens à vontade.
            </p>
            <EmailEditor content={body} onChange={setBody} />
          </>
        ) : (
          <>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={useTemplate}
                onChange={e => setUseTemplate(e.target.checked)}
                className="accent-[#1b4332]"
              />
              Inserir no template padrão OpenSyntropy (desmarque se o HTML já é um email completo)
            </label>
            <textarea
              value={htmlSource}
              onChange={e => handleHtmlChange(e.target.value)}
              placeholder="Cole aqui o HTML do email..."
              spellCheck={false}
              className="w-full h-72 border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#52b788] resize-y"
            />
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1.5">Pré-visualização ao vivo</div>
              <iframe
                srcDoc={previewHtml}
                sandbox=""
                className="w-full rounded-lg border border-gray-200 bg-white"
                style={{ height: 600 }}
                title="Pré-visualização do HTML"
              />
            </div>
          </>
        )}
      </div>

      {/* Test send */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-[#52b788] inline-block" />
          Enviar teste
        </h2>
        <p className="text-xs text-gray-400">
          Envia só para o endereço abaixo, com o assunto prefixado por [TESTE].
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTestSend()}
            placeholder="seu@email.com"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#52b788] transition-colors"
          />
          <button
            type="button"
            onClick={handleTestSend}
            disabled={testing || !subject || !testEmail}
            className="px-5 py-2.5 text-sm font-semibold border border-[#1b4332] text-[#1b4332] rounded-lg hover:bg-[#f0fdf4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing && <span className="w-4 h-4 border-2 border-[#1b4332]/30 border-t-[#1b4332] rounded-full animate-spin" />}
            {testing ? 'Enviando...' : 'Enviar teste'}
          </button>
        </div>
        {testResult && (
          <div className={`text-sm ${testResult.ok ? 'text-[#1b4332]' : 'text-red-700'}`}>{testResult.message}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
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
                sandbox=""
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
