import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminActions from './AdminActions'
import AdminAccessTabs, { type PixCharge, type UserProduct } from './AdminAccessTabs'
import AdminHeader from './AdminHeader'
import { PRODUCTS } from '@/config/products'
import type { ProductId } from '@/config/products'

export const dynamic = 'force-dynamic'

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
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

interface RefundRequest {
  id: string
  email: string
  reason: string | null
  status: string
  created_at: string
}

export default async function AdminPage() {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') redirect('/admin/login')

  const service = await createServiceClient()

  // Midnight in Brazil (UTC-3) as a UTC ISO string
  const todayBRT = new Date().toLocaleDateString('sv', { timeZone: 'America/Sao_Paulo' })
  const todayISO = new Date(todayBRT + 'T00:00:00-03:00').toISOString()
  const weekISO = new Date(Date.now() - 7 * 86400000).toISOString()
  const monthISO = new Date(Date.now() - 30 * 86400000).toISOString()

  const [productsRes, refundsRes, pixRes, downloadsRes, visitsTodayRes, visitsWeekRes, visitsMonthRes, expiredRes] = await Promise.all([
    service.from('user_products').select('*').order('created_at', { ascending: false }),
    service.from('refund_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    service.from('pix_charges').select('*,payment_method,installment_count').order('created_at', { ascending: false }),
    service.from('download_tokens').select('email').or('used.eq.true,download_count.gt.0'),
    service.from('page_visits').select('id', { count: 'exact', head: true }).eq('page', '/ebook').gte('created_at', todayISO),
    service.from('page_visits').select('id', { count: 'exact', head: true }).eq('page', '/ebook').gte('created_at', weekISO),
    service.from('page_visits').select('id', { count: 'exact', head: true }).eq('page', '/ebook').gte('created_at', monthISO),
    service.from('pix_charges').select('id', { count: 'exact', head: true }).eq('status', 'expired').gte('created_at', monthISO),
  ])

  const visitsToday = visitsTodayRes.count ?? 0
  const visitsWeek = visitsWeekRes.count ?? 0
  const visitsMonth = visitsMonthRes.count ?? 0
  const expiredCount = expiredRes.count ?? 0
  const pixRows: PixCharge[] = pixRes.data ?? []

  const confirmedRows = pixRows.filter(p => p.status === 'confirmed')
  function salesStats(sinceISO: string) {
    const filtered = confirmedRows.filter(p => (p.confirmed_at ?? p.created_at) >= sinceISO)
    const count = filtered.length
    const cents = filtered.reduce((sum, p) => sum + (PRODUCTS[p.product as ProductId]?.price ?? 0), 0)
    return { count, value: cents / 100 }
  }
  const salesDay   = salesStats(todayISO)
  const salesWeek  = salesStats(weekISO)
  const salesMonth = salesStats(monthISO)

  const checkoutsToday = pixRows.filter(p => p.created_at >= todayISO).length
  const checkoutsWeek  = pixRows.filter(p => p.created_at >= weekISO).length
  const checkoutsMonth = pixRows.filter(p => p.created_at >= monthISO).length

  const cutoff25h = new Date(Date.now() - 25 * 60 * 60 * 1000)
  // Sai da lista após pagamento (status != pending) ou após o 2º lembrete (recovery_sent_at_2)
  const pendingPix = pixRows.filter(p => p.status === 'pending' && !p.recovery_sent_at_2 && new Date(p.created_at) > cutoff25h)
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
    name: p.asaas_payment_id ? pixNameMap[p.asaas_payment_id] : (p.name ?? undefined),
  }))
  const downloadedEmails: string[] = [...new Set((downloadsRes.data ?? []).map(d => d.email))]
  const refundRows: RefundRequest[] = refundsRes.data ?? []

  // Acessos pagos: via Asaas (PIX/cartão) ou marcados como pagos manualmente — exclui cortesias
  const paidRows = rows.filter(r => r.asaas_payment_id || r.manual_paid)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Zone 1: Barra de status */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-500">Acessos ativos (pagos)</span>
            <span className="text-sm font-bold text-[#1b4332]">{paidRows.length}</span>
          </div>
          {pendingPix.length > 0 && (
            <a
              href="/admin/aguardando"
              className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 hover:border-yellow-400 rounded-lg px-4 py-2 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-sm font-semibold text-yellow-800">
                {pendingPix.length} PIX aguardando recuperação
              </span>
              <span className="text-yellow-600 text-xs">→</span>
            </a>
          )}
          {refundRows.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-sm font-semibold text-red-800">
                {refundRows.length} devolução{refundRows.length > 1 ? 'ões' : ''} pendente{refundRows.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
              <span className="text-sm text-orange-700">
                <span className="font-semibold">{expiredCount}</span> PIX expirado{expiredCount > 1 ? 's' : ''} (30d)
              </span>
            </div>
          )}
        </div>

        {/* Zone 2: Funil de performance */}
        <div>
          <SectionHeader title="Funil de performance" />
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold" />
                  <th className="text-right px-6 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">Hoje</th>
                  <th className="text-right px-6 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">7 dias</th>
                  <th className="text-right px-6 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">30 dias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">Visitas</td>
                  <FunnelCell value={visitsToday} />
                  <FunnelCell value={visitsWeek} />
                  <FunnelCell value={visitsMonth} />
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">Checkouts iniciados</td>
                  <FunnelCell value={checkoutsToday} rate={visitsToday > 0 ? checkoutsToday / visitsToday : null} />
                  <FunnelCell value={checkoutsWeek}  rate={visitsWeek  > 0 ? checkoutsWeek  / visitsWeek  : null} />
                  <FunnelCell value={checkoutsMonth} rate={visitsMonth > 0 ? checkoutsMonth / visitsMonth : null} />
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">Vendas confirmadas</td>
                  <FunnelCell value={salesDay.count}   rate={checkoutsToday > 0 ? salesDay.count   / checkoutsToday : null} highlight />
                  <FunnelCell value={salesWeek.count}  rate={checkoutsWeek  > 0 ? salesWeek.count  / checkoutsWeek  : null} highlight />
                  <FunnelCell value={salesMonth.count} rate={checkoutsMonth > 0 ? salesMonth.count / checkoutsMonth : null} highlight />
                </tr>
                <tr className="bg-[#f0fdf4]/60">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700">Receita</td>
                  {([salesDay, salesWeek, salesMonth] as const).map((s, i) => (
                    <td key={i} className="px-6 py-4 text-right">
                      <span className="text-xl font-bold text-[#1b4332]">
                        {s.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Zone 6: Ações pendentes */}
        <div className="grid grid-cols-1 gap-8">
          {refundRows.length > 0 && (
            <div>
              <SectionHeader
                title="Pedidos de devolução"
                count={refundRows.length}
                badge={
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {refundRows.length} pendente{refundRows.length > 1 ? 's' : ''}
                  </span>
                }
              />
              <div className="bg-white rounded-xl border border-red-100 overflow-x-auto">
                <table className="w-full text-base">
                  <thead className="bg-red-50 text-red-800 text-sm uppercase tracking-wide font-semibold">
                    <tr>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Motivo</th>
                      <th className="text-left px-4 py-3">Data</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50">
                    {refundRows.map(row => (
                      <tr key={row.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{row.email}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{row.reason ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">{fmt(row.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <AdminActions mode="resolve-refund" id={row.id} status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Zone 6: Clientes */}
        <AdminAccessTabs rows={rows} pixUtmMap={pixUtmMap} downloadedEmails={downloadedEmails} />

      </div>
    </div>
  )
}

function FunnelCell({ value, rate, highlight }: { value: number; rate?: number | null; highlight?: boolean }) {
  return (
    <td className="px-6 py-4 text-right">
      <span className={`text-xl font-bold ${highlight ? 'text-[#1b4332]' : 'text-gray-800'}`}>
        {value.toLocaleString('pt-BR')}
      </span>
      {rate != null && (
        <span className="ml-2 text-xs font-medium text-gray-400">
          {Math.round(rate * 100)}%
        </span>
      )}
    </td>
  )
}
