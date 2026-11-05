'use client'

import { useEffect, useState } from 'react'

type Aula = { href: string; titulo: string; data: string }
type Resultado = { ok: boolean; message: string } | null

async function post(payload: object) {
  const res = await fetch('/api/admin/avisar-aula', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, ...json }
}

export default function AvisarAula({ aulas, destinos }: { aulas: Aula[]; destinos: number }) {
  const [href, setHref] = useState(aulas[0]?.href ?? '')
  const titulo = aulas.find(a => a.href === href)?.titulo ?? ''
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('Oi! Gravei uma aula nova no Desperto e ela já está no ar.')
  const [preview, setPreview] = useState('')
  const [teste, setTeste] = useState('')
  const [repetir, setRepetir] = useState(false)
  const [jaAvisado, setJaAvisado] = useState<{ created_at: string; enviados: number } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [resultado, setResultado] = useState<Resultado>(null)

  const assuntoFinal = assunto.trim() || `Aula nova: ${titulo}`

  useEffect(() => {
    if (!href) return
    const t = setTimeout(async () => {
      const [p, d] = await Promise.all([post({ href, assunto, mensagem, preview: true }), post({ href, dryRun: true })])
      if (p.html) setPreview(p.html)
      setJaAvisado(d.jaAvisado ?? null)
    }, 400)
    return () => clearTimeout(t)
  }, [href, assunto, mensagem])

  async function enviarTeste() {
    setOcupado(true); setResultado(null)
    const r = await post({ href, assunto, mensagem, testTo: teste })
    setResultado({ ok: r.ok, message: r.message ?? 'Erro.' }); setOcupado(false)
  }

  async function enviar() {
    if (!confirm(`Enviar "${assuntoFinal}" para ${destinos} inscrito(s)?`)) return
    setOcupado(true); setResultado(null)
    const r = await post({ href, assunto, mensagem, repetir })
    setResultado({ ok: r.ok, message: r.message ?? 'Erro.' }); setOcupado(false)
    if (r.ok) setJaAvisado({ created_at: new Date().toISOString(), enviados: r.sent ?? 0 })
  }

  if (aulas.length === 0) return null

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="font-bold text-gray-800">📣 Avisar sobre nova aula</h2>
      <p className="text-sm text-gray-500 mb-5">E-mail para os {destinos} inscrito(s) ativos, com a capa e o link da aula e o convite para a comunidade.</p>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="font-semibold text-gray-700">Aula</span>
            <select className="mt-1 w-full border rounded-lg px-3 py-2" value={href} onChange={e => setHref(e.target.value)}>
              {aulas.map(a => <option key={a.href} value={a.href}>{a.data} · {a.titulo}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-gray-700">Assunto</span>
            <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder={`Aula nova: ${titulo}`} value={assunto} onChange={e => setAssunto(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-gray-700">Mensagem (opcional, aparece antes do cartão da aula)</span>
            <textarea className="mt-1 w-full border rounded-lg px-3 py-2 h-32" value={mensagem} onChange={e => setMensagem(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <input className="flex-1 border rounded-lg px-3 py-2 text-sm" type="email" placeholder="e-mail para teste" value={teste} onChange={e => setTeste(e.target.value)} />
            <button type="button" disabled={ocupado || !teste} onClick={enviarTeste} className="text-sm font-semibold border rounded-lg px-4 py-2 disabled:opacity-50">Enviar teste</button>
          </div>
          {jaAvisado && (
            <label className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg p-3">
              <input type="checkbox" className="mt-1" checked={repetir} onChange={e => setRepetir(e.target.checked)} />
              <span>Esta aula já foi avisada em {new Date(jaAvisado.created_at).toLocaleString('pt-BR')} ({jaAvisado.enviados} e-mails). Marque para enviar de novo.</span>
            </label>
          )}
          <button type="button" disabled={ocupado || destinos === 0 || (!!jaAvisado && !repetir)} onClick={enviar}
            className="w-full bg-[#1b4332] text-white font-bold rounded-xl py-3 disabled:opacity-50">
            {ocupado ? 'Enviando…' : `Avisar ${destinos} inscrito(s)`}
          </button>
          {resultado && <p className={`text-sm rounded-lg p-3 ${resultado.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{resultado.message}</p>}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Prévia</p>
          <iframe title="Prévia do e-mail" srcDoc={preview} className="w-full h-[560px] border rounded-lg bg-[#FBF5EC]" sandbox="" />
        </div>
      </div>
    </section>
  )
}
