'use client'
import { useState } from 'react'
import AdminActions from './AdminActions'

interface UserProduct {
  id: string
  user_id: string
  product: string
  asaas_payment_id: string | null
  created_at: string
  email?: string
  name?: string
}

interface PixCharge {
  id: string
  asaas_payment_id: string
  email: string
  name: string | null
  product: string
  status: string
  created_at: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  payment_method: string | null
  installment_count: number | null
}

interface Props {
  rows: UserProduct[]
  pixUtmMap: Record<string, PixCharge>
  downloadedEmails: string[]
}

const SESSION_PRODUCTS = new Set(['session', 'session_upsell'])

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function ProductBadge({ product }: { product: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    ebook:          { label: 'Ebook',            cls: 'bg-[#d8f3dc] text-[#1b4332]' },
    session:        { label: 'Ebook + Sessão',   cls: 'bg-blue-100 text-blue-700' },
    session_upsell: { label: 'Sessão (upsell)',  cls: 'bg-indigo-100 text-indigo-700' },
    bundle:         { label: 'Bundle',           cls: 'bg-[#1b4332] text-white' },
    course:         { label: 'Curso',            cls: 'bg-purple-100 text-purple-700' },
  }
  const { label, cls } = config[product] ?? { label: product, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

function PaymentBadge({ method, installments }: { method: string | null | undefined; installments: number | null | undefined }) {
  if (method === 'card') {
    const label = installments && installments > 1 ? `Cartão ${installments}x` : 'Cartão 1x'
    return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{label}</span>
  }
  if (method === 'pix') {
    return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">PIX</span>
  }
  return <span className="text-gray-300 text-xs">—</span>
}

function OriginBadge({ row }: { row?: { utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; utm_term?: string | null; utm_content?: string | null } }) {
  if (!row?.utm_source) return <span className="text-gray-300 text-xs">direto</span>

  const srcColors: Record<string, string> = {
    facebook: 'bg-blue-100 text-blue-700',
    instagram: 'bg-pink-100 text-pink-700',
    google: 'bg-yellow-100 text-yellow-700',
    email: 'bg-purple-100 text-purple-700',
  }
  const srcColor = srcColors[row.utm_source.toLowerCase()] ?? 'bg-gray-100 text-gray-600'

  const fields: { label: string; value: string | null | undefined }[] = [
    { label: 'medium',   value: row.utm_medium },
    { label: 'campaign', value: row.utm_campaign },
    { label: 'adset',    value: row.utm_term },
    { label: 'ad',       value: row.utm_content },
  ]

  return (
    <div className="flex flex-col gap-0.5 min-w-[180px]">
      <span className={`inline-block self-start px-2 py-0.5 rounded-full text-xs font-semibold mb-0.5 ${srcColor}`}>
        {row.utm_source}
      </span>
      {fields.map(({ label, value }) =>
        value ? (
          <div key={label} className="flex items-baseline gap-1 text-xs">
            <span className="text-gray-400 w-[52px] shrink-0">{label}</span>
            <span className="truncate max-w-[200px] text-gray-600" title={value}>{value}</span>
          </div>
        ) : (
          <div key={label} className="flex items-baseline gap-1 text-xs">
            <span className="text-gray-300 w-[52px] shrink-0">{label}</span>
            <span className="text-gray-200">—</span>
          </div>
        )
      )}
    </div>
  )
}

function AccessTable({ rows, pixUtmMap, downloadedSet, emptyMsg }: { rows: UserProduct[]; pixUtmMap: Record<string, PixCharge>; downloadedSet: Set<string>; emptyMsg: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#b7e4c7] overflow-x-auto">
      <table className="min-w-[900px] w-full text-base">
        <thead className="bg-[#f0fdf4] text-[#1b4332] text-sm uppercase tracking-wide font-semibold">
          <tr>
            <th className="text-left px-4 py-3">Nome</th>
            <th className="text-left px-4 py-3">Email</th>
            <th className="text-left px-4 py-3">Produto</th>
            <th className="text-left px-4 py-3">Pagamento</th>
            <th className="text-left px-4 py-3">Download</th>
            <th className="text-left px-4 py-3">Data</th>
            <th className="text-left px-4 py-3">Origem</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d8f3dc]">
          {rows.map(row => (
            <tr key={row.id} className="hover:bg-[#f0fdf4]/60 transition-colors">
              <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate" title={row.name ?? undefined}>{row.name ?? <span className="text-gray-300">—</span>}</td>
              <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px] truncate" title={row.email}>{row.email}</td>
              <td className="px-4 py-3"><ProductBadge product={row.product} /></td>
              <td className="px-4 py-3">
                {row.asaas_payment_id
                  ? <PaymentBadge method={pixUtmMap[row.asaas_payment_id]?.payment_method} installments={pixUtmMap[row.asaas_payment_id]?.installment_count} />
                  : <span className="text-gray-300 text-xs">manual</span>}
              </td>
              <td className="px-4 py-3">
                {downloadedSet.has(row.email ?? '')
                  ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Baixado</span>
                  : <span className="text-gray-300 text-xs">—</span>}
              </td>
              <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">{fmt(row.created_at)}</td>
              <td className="px-4 py-3">
                {row.asaas_payment_id
                  ? <OriginBadge row={pixUtmMap[row.asaas_payment_id]} />
                  : <span className="text-sm text-gray-300">manual</span>}
              </td>
              <td className="px-4 py-3 text-right">
                <AdminActions id={row.id} email={row.email ?? ''} product={row.product} userId={row.user_id} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-gray-300 text-base">{emptyMsg}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminAccessTabs({ rows, pixUtmMap, downloadedEmails }: Props) {
  const [tab, setTab] = useState<'ebooks' | 'sessions'>('ebooks')
  const downloadedSet = new Set(downloadedEmails)

  const ebookRows = rows.filter(r => !SESSION_PRODUCTS.has(r.product))
  const sessionRows = rows.filter(r => SESSION_PRODUCTS.has(r.product))

  const tabs = [
    { id: 'ebooks' as const,   label: 'Ebooks',   count: ebookRows.length },
    { id: 'sessions' as const, label: 'Sessões',  count: sessionRows.length },
  ]

  return (
    <div>
      <div className="flex items-center gap-1 mb-4">
        <div className="w-1 h-6 rounded-full bg-[#52b788]" />
        <div className="ml-2 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-md text-base font-bold transition-colors"
              style={tab === t.id
                ? { backgroundColor: '#1b4332', color: '#fff' }
                : { color: '#6b7280' }}
            >
              {t.label}
              <span className="ml-1.5 text-sm font-normal opacity-70">({t.count})</span>
            </button>
          ))}
        </div>
      </div>
      {tab === 'ebooks'
        ? <AccessTable rows={ebookRows} pixUtmMap={pixUtmMap} downloadedSet={downloadedSet} emptyMsg="Nenhum acesso de ebook cadastrado." />
        : <AccessTable rows={sessionRows} pixUtmMap={pixUtmMap} downloadedSet={downloadedSet} emptyMsg="Nenhuma sessão cadastrada ainda." />
      }
    </div>
  )
}
