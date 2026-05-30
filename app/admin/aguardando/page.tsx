import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminActions from '../AdminActions'
import AdminHeader from '../AdminHeader'
import { type PixCharge } from '../AdminAccessTabs'

export const dynamic = 'force-dynamic'

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
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
  return <span className="text-gray-300 text-xs">—</span>
}

export default async function AguardandoPage() {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') redirect('/admin/login')

  const service = await createServiceClient()
  const { data } = await service
    .from('pix_charges')
    .select('*,payment_method,installment_count')
    .order('created_at', { ascending: false })

  const pixRows: PixCharge[] = data ?? []
  const cutoff25h = new Date(Date.now() - 25 * 60 * 60 * 1000)
  // Aguardando recuperação: pendente, ainda dentro da janela de 25h e sem o 2º lembrete enviado
  const pendingPix = pixRows.filter(p => p.status === 'pending' && !p.recovery_sent_at_2 && new Date(p.created_at) > cutoff25h)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AdminHeader />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-[#52b788]" />
          <h2 className="text-lg font-bold text-gray-700">
            PIX aguardando recuperação
            <span className="ml-1.5 text-gray-400 font-normal text-base">({pendingPix.length})</span>
          </h2>
          {pendingPix.length > 0 && (
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">
              {pendingPix.length} pendente{pendingPix.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl border border-yellow-200 overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-yellow-50 text-yellow-800 text-sm uppercase tracking-wide font-semibold">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-left px-4 py-3">Pagamento</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-50">
              {pendingPix.map(row => (
                <tr key={row.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 text-sm">{row.email}</p>
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
                  <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">{fmt(row.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <AdminActions mode="copy-pix" pixPayload={row.pix_payload ?? undefined} />
                      <AdminActions mode="confirm-pix" id={row.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {pendingPix.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-300 text-base">
                    Nenhum PIX aguardando recuperação.
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
