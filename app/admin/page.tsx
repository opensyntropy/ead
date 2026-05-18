import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminActions from './AdminActions'
import { adminLogout } from './actions'

export const dynamic = 'force-dynamic'

interface UserProduct {
  id: string
  user_id: string
  product: string
  asaas_payment_id: string | null
  created_at: string
  email?: string
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

  const [productsRes, refundsRes, usersRes] = await Promise.all([
    service.from('user_products').select('*').order('created_at', { ascending: false }),
    service.from('refund_requests').select('*').order('created_at', { ascending: false }),
    service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const products = productsRes.data
  const refunds = refundsRes.data
  const authUsers = usersRes.data?.users ?? []

  const emailMap = Object.fromEntries(authUsers.map(u => [u.id, u.email ?? '']))
  const rows: UserProduct[] = (products ?? []).map(p => ({ ...p, email: emailMap[p.user_id] ?? p.user_id }))
  const refundRows: RefundRequest[] = refunds ?? []
  const pendingRefunds = refundRows.filter(r => r.status === 'pending').length

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-serif font-bold text-[#1b4332]">Painel Admin</h1>
        <form action={adminLogout}>
          <button type="submit" className="text-sm text-gray-400 hover:text-gray-600">Sair</button>
        </form>
      </div>

      {/* Pedidos de devolução */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-3">
          Pedidos de devolução ({refundRows.length})
          {pendingRefunds > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingRefunds} pendente{pendingRefunds > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-red-50 text-red-800 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Motivo</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {refundRows.map(row => (
                <tr key={row.id} className="border-t border-red-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.email}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{row.reason ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      row.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {row.status === 'pending' ? 'Pendente' : row.status === 'resolved' ? 'Resolvido' : row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(row.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <AdminActions mode="resolve-refund" id={row.id} status={row.status} />
                  </td>
                </tr>
              ))}
              {refundRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nenhum pedido de devolução.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acessos ativos */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Acessos ativos ({rows.length})
        </h2>
        <div className="bg-white rounded-xl border border-[#b7e4c7] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f0fdf4] text-[#1b4332] text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-left px-4 py-3">Pagamento Asaas</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-t border-[#d8f3dc] hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.product === 'bundle' ? 'bg-[#1b4332] text-white' :
                      row.product === 'ebook' ? 'bg-[#d8f3dc] text-[#1b4332]' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {row.product}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {row.asaas_payment_id ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(row.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <AdminActions id={row.id} email={row.email ?? ''} product={row.product} userId={row.user_id} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nenhum acesso cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adicionar acesso manual */}
      <div className="bg-white rounded-xl border border-[#b7e4c7] p-6">
        <h2 className="text-base font-semibold text-[#1b4332] mb-4">Adicionar acesso manual</h2>
        <AdminActions mode="add" />
      </div>
    </div>
  )
}
