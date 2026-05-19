import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminActions from './AdminActions'
import AdminAccessTabs from './AdminAccessTabs'
import AdminHeader from './AdminHeader'

export const dynamic = 'force-dynamic'

function OriginBadge({ row }: { row?: { utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null } }) {
  if (!row?.utm_source) return <span className="text-gray-300 text-xs">direto</span>
  const label = [row.utm_source, row.utm_campaign].filter(Boolean).join(' / ')
  const colors: Record<string, string> = {
    facebook: 'bg-blue-100 text-blue-700',
    instagram: 'bg-pink-100 text-pink-700',
    google: 'bg-yellow-100 text-yellow-700',
    email: 'bg-purple-100 text-purple-700',
  }
  const colorClass = colors[row.utm_source.toLowerCase()] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`} title={`medium: ${row.utm_medium ?? '—'}`}>
      {label}
    </span>
  )
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function SectionHeader({ title, count, badge }: { title: string; count?: number; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-6 rounded-full bg-[#52b788]" />
      <h2 className="text-lg font-bold text-gray-700">
        {title}{count !== undefined && <span className="ml-1.5 text-gray-400 font-normal text-base">({count})</span>}
      </h2>
      {badge}
    </div>
  )
}

interface UserProduct {
  id: string
  user_id: string
  product: string
  asaas_payment_id: string | null
  created_at: string
  email?: string
  name?: string
}

interface RefundRequest {
  id: string
  email: string
  reason: string | null
  status: string
  created_at: string
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
  utm_content: string | null
}

export default async function AdminPage() {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') redirect('/admin/login')

  const service = await createServiceClient()

  const [productsRes, refundsRes, pixRes, downloadsRes] = await Promise.all([
    service.from('user_products').select('*').order('created_at', { ascending: false }),
    service.from('refund_requests').select('*').order('created_at', { ascending: false }),
    service.from('pix_charges').select('*').order('created_at', { ascending: false }),
    service.from('download_tokens').select('email').eq('used', true),
  ])

  const pixRows: PixCharge[] = pixRes.data ?? []
  const pendingPix = pixRows.filter(p => p.status === 'pending')
  const pixUtmMap = Object.fromEntries(pixRows.map(p => [p.asaas_payment_id, p]))
  const pixNameMap = Object.fromEntries(pixRows.filter(p => p.name).map(p => [p.asaas_payment_id, p.name!]))
  const pixEmailMap = Object.fromEntries(pixRows.map(p => [p.asaas_payment_id, p.email]))

  const productData = productsRes.data ?? []
  const uniqueUserIds = [...new Set(productData.map(p => p.user_id))]
  const userResults = await Promise.all(
    uniqueUserIds.map(id => service.auth.admin.getUserById(id))
  )
  const emailMap = Object.fromEntries(
    uniqueUserIds.map((id, i) => [id, userResults[i]?.data?.user?.email ?? ''])
  )

  const rows: UserProduct[] = productData.map(p => ({
    ...p,
    email: emailMap[p.user_id]
      || (p.asaas_payment_id ? pixEmailMap[p.asaas_payment_id] : undefined)
      || p.user_id,
    name: p.asaas_payment_id ? pixNameMap[p.asaas_payment_id] : undefined,
  }))
  const downloadedEmails: string[] = [...new Set((downloadsRes.data ?? []).map(d => d.email))]
  const refundRows: RefundRequest[] = refundsRes.data ?? []
  const pendingRefunds = refundRows.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AdminHeader />

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-sm text-gray-400 uppercase tracking-wide mb-1 font-medium">Acessos ativos</p>
            <p className="text-4xl font-bold text-[#1b4332]">{rows.length}</p>
          </div>
          <div className={`bg-white rounded-xl border px-5 py-4 ${pendingPix.length > 0 ? 'border-yellow-300' : 'border-gray-200'}`}>
            <p className="text-sm text-gray-400 uppercase tracking-wide mb-1 font-medium">PIX pendentes</p>
            <p className={`text-4xl font-bold ${pendingPix.length > 0 ? 'text-yellow-600' : 'text-gray-300'}`}>{pendingPix.length}</p>
          </div>
          <div className={`bg-white rounded-xl border px-5 py-4 ${pendingRefunds > 0 ? 'border-red-300' : 'border-gray-200'}`}>
            <p className="text-sm text-gray-400 uppercase tracking-wide mb-1 font-medium">Devoluções pendentes</p>
            <p className={`text-4xl font-bold ${pendingRefunds > 0 ? 'text-red-500' : 'text-gray-300'}`}>{pendingRefunds}</p>
          </div>
        </div>

        {/* PIX pendentes */}
        {pendingPix.length > 0 && (
          <div>
            <SectionHeader
              title="PIX aguardando confirmação"
              badge={
                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingPix.length} pendente{pendingPix.length > 1 ? 's' : ''}
                </span>
              }
            />
            <div className="bg-white rounded-xl border border-yellow-200 overflow-x-auto">
              <table className="w-full text-base">
                <thead className="bg-yellow-50 text-yellow-800 text-sm uppercase tracking-wide font-semibold">
                  <tr>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Nome</th>
                    <th className="text-left px-4 py-3">Produto</th>
                    <th className="text-left px-4 py-3">Origem</th>
                    <th className="text-left px-4 py-3">Data</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-50">
                  {pendingPix.map(row => (
                    <tr key={row.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.email}</td>
                      <td className="px-4 py-3 text-gray-500">{row.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <ProductBadge product={row.product} />
                      </td>
                      <td className="px-4 py-3"><OriginBadge row={row} /></td>
                      <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">{fmt(row.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <AdminActions mode="confirm-pix" id={row.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pedidos de devolução */}
        <div>
          <SectionHeader
            title="Pedidos de devolução"
            count={refundRows.length}
            badge={pendingRefunds > 0 ? (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRefunds} pendente{pendingRefunds > 1 ? 's' : ''}
              </span>
            ) : undefined}
          />
          <div className="bg-white rounded-xl border border-red-100 overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-red-50 text-red-800 text-sm uppercase tracking-wide font-semibold">
                <tr>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Motivo</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50">
                {refundRows.map(row => (
                  <tr key={row.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.email}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{row.reason ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-sm font-medium ${
                        row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        row.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {row.status === 'pending' ? 'Pendente' : row.status === 'resolved' ? 'Resolvido' : row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">{fmt(row.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <AdminActions mode="resolve-refund" id={row.id} status={row.status} />
                    </td>
                  </tr>
                ))}
                {refundRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-300 text-base">
                      Nenhum pedido de devolução.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acessos ativos */}
        <AdminAccessTabs rows={rows} pixUtmMap={pixUtmMap} downloadedEmails={downloadedEmails} />

      </div>
    </div>
  )
}

function ProductBadge({ product }: { product: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    ebook:   { label: 'Ebook',            cls: 'bg-[#d8f3dc] text-[#1b4332]' },
    session:        { label: 'Ebook + Sessão',   cls: 'bg-blue-100 text-blue-700' },
    session_upsell: { label: 'Sessão (upsell)', cls: 'bg-indigo-100 text-indigo-700' },
    bundle:  { label: 'Bundle',           cls: 'bg-[#1b4332] text-white' },
    course:  { label: 'Curso',            cls: 'bg-purple-100 text-purple-700' },
  }
  const { label, cls } = config[product] ?? { label: product, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
