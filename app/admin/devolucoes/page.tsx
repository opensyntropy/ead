import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminActions from '../AdminActions'
import AdminHeader from '../AdminHeader'

export const dynamic = 'force-dynamic'

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

interface RefundRequest {
  id: string
  email: string
  reason: string | null
  status: string
  created_at: string
}

export default async function DevolucoesPage() {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') redirect('/admin/login')

  const service = await createServiceClient()
  const { data } = await service
    .from('refund_requests')
    .select('*')
    .order('created_at', { ascending: false })

  const rows: RefundRequest[] = data ?? []
  const pending  = rows.filter(r => r.status === 'pending').length
  const resolved = rows.filter(r => r.status === 'resolved').length

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AdminHeader />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-[#52b788]" />
          <h2 className="text-lg font-bold text-gray-700">
            Pedidos de devolução
            <span className="ml-1.5 text-gray-400 font-normal text-base">({rows.length})</span>
          </h2>
          <div className="flex items-center gap-2 ml-1">
            {pending > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pending} pendente{pending > 1 ? 's' : ''}
              </span>
            )}
            {resolved > 0 && (
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {resolved} resolvido{resolved > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wide font-semibold">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Motivo</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.email}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{row.reason ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-sm font-medium ${
                      row.status === 'pending'  ? 'bg-yellow-100 text-yellow-800' :
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
              {rows.length === 0 && (
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
    </div>
  )
}
