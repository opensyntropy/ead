import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminHeader from '../AdminHeader'
import { type PixCharge } from '../AdminAccessTabs'
import { PRODUCTS, type ProductId } from '@/config/products'

export const dynamic = 'force-dynamic'

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ProductBadge({ product }: { product: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    ebook:          { label: 'Ebook',          cls: 'bg-[#d8f3dc] text-[#1b4332]' },
    session:        { label: 'Ebook + Sessão', cls: 'bg-blue-100 text-blue-700' },
    session_upsell: { label: 'Sessão (upsell)', cls: 'bg-indigo-100 text-indigo-700' },
    bundle:         { label: 'Bundle',         cls: 'bg-[#1b4332] text-white' },
    course:         { label: 'Curso',          cls: 'bg-purple-100 text-purple-700' },
  }
  const { label, cls } = config[product] ?? { label: product, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
}

function PaymentBadge({ method, installments }: { method: string | null; installments: number | null }) {
  if (method === 'card') {
    const label = installments && installments > 1 ? `Cartão ${installments}x` : 'Cartão 1x'
    return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{label}</span>
  }
  if (method === 'pix') {
    return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">PIX</span>
  }
  // Linhas antigas (anteriores à coluna payment_method) são todas PIX
  return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">PIX</span>
}

export default async function ExpiradosPage() {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') redirect('/admin/login')

  const service = await createServiceClient()
  const [pixRes, productsRes] = await Promise.all([
    service.from('pix_charges').select('*,payment_method,installment_count').order('created_at', { ascending: false }),
    service.from('user_products').select('user_id,product'),
  ])
  const pixRows: PixCharge[] = pixRes.data ?? []
  const productRows = productsRes.data ?? []

  // Resolve os e-mails dos acessos já concedidos (Asaas, manual ou cortesia) para
  // confirmar quem já tem o produto e não deve aparecer como "não pago".
  const uniqueUserIds = [...new Set(productRows.map(p => p.user_id))]
  const userResults = await Promise.all(
    uniqueUserIds.map(id => service.auth.admin.getUserById(id).catch(() => null))
  )
  const emailById: Record<string, string | null> = Object.fromEntries(
    uniqueUserIds.map((id, i) => [id, userResults[i]?.data?.user?.email?.toLowerCase() ?? null])
  )

  // email|produto que já está quitado: pagamento confirmado OU acesso concedido.
  // É esta a verificação "pelo e-mail" — se a pessoa pagou (mesmo numa cobrança
  // posterior) ou recebeu acesso, a cobrança expirada não conta como perdida.
  const settledKey = new Set<string>()
  const paidEmails = new Set<string>() // qualquer compra confirmada → flag "já é cliente"
  for (const p of pixRows) {
    if (p.status === 'confirmed' && p.email) {
      const e = p.email.toLowerCase()
      settledKey.add(`${e}|${p.product}`)
      paidEmails.add(e)
    }
  }
  for (const up of productRows) {
    const e = emailById[up.user_id]
    if (e) settledKey.add(`${e}|${up.product}`)
  }

  // Expiradas (PIX e cartão) sem pagamento/acesso do mesmo produto.
  const candidates = pixRows.filter(p =>
    p.status === 'expired' && p.email && !settledKey.has(`${p.email.toLowerCase()}|${p.product}`)
  )

  // Dedup por e-mail+produto: mantém a tentativa mais recente e conta as tentativas.
  const byKey = new Map<string, { row: PixCharge; attempts: number }>()
  for (const p of candidates) {
    const key = `${p.email.toLowerCase()}|${p.product}`
    const cur = byKey.get(key)
    if (!cur) byKey.set(key, { row: p, attempts: 1 })
    else {
      cur.attempts++
      if (p.created_at > cur.row.created_at) cur.row = p
    }
  }
  const items = [...byKey.values()].sort((a, b) => b.row.created_at.localeCompare(a.row.created_at))
  const lostCents = items.reduce((s, it) => s + (PRODUCTS[it.row.product as ProductId]?.price ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AdminHeader />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-gray-400" />
          <h2 className="text-lg font-bold text-gray-700">
            Expirados / não pagos
            <span className="ml-1.5 text-gray-400 font-normal text-base">({items.length})</span>
          </h2>
          {items.length > 0 && (
            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">
              {fmtBRL(lostCents)} em vendas perdidas
            </span>
          )}
        </div>

        <p className="text-sm text-gray-400 mb-6 max-w-2xl">
          Cobranças (PIX e cartão) que expiraram sem pagamento. Já excluímos quem,
          pelo e-mail, pagou em outra cobrança ou recebeu acesso ao mesmo produto.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wide font-semibold">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-left px-4 py-3">Pagamento</th>
                <th className="text-right px-4 py-3">Tentativas</th>
                <th className="text-right px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3">Última tentativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(({ row, attempts }) => (
                <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 text-sm">{row.email}</p>
                      {row.email && paidEmails.has(row.email.toLowerCase()) && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 whitespace-nowrap"
                          title="Este e-mail já comprou outro produto">
                          já é cliente
                        </span>
                      )}
                    </div>
                    {row.name && <p className="text-xs text-gray-400">{row.name}</p>}
                    {row.whatsapp && (() => {
                      const digits = row.whatsapp.replace(/\D/g, '')
                      const waNumber = digits.startsWith('55') ? digits : `55${digits}`
                      return (
                        <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:text-green-800 hover:underline">
                          {row.whatsapp}
                        </a>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3"><ProductBadge product={row.product} /></td>
                  <td className="px-4 py-3"><PaymentBadge method={row.payment_method} installments={row.installment_count} /></td>
                  <td className="px-4 py-3 text-right text-gray-500 text-sm tabular-nums">{attempts}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-sm tabular-nums whitespace-nowrap">
                    {fmtBRL(PRODUCTS[row.product as ProductId]?.price ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">{fmt(row.created_at)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-300 text-base">
                    Nenhuma cobrança expirada sem pagamento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
