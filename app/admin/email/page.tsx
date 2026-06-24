import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminHeader from '../AdminHeader'
import EmailBroadcastForm from './EmailBroadcastForm'

export const dynamic = 'force-dynamic'

export default async function EmailBroadcastPage() {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') redirect('/admin/login')

  const service = await createServiceClient()
  const { data: products } = await service
    .from('user_products')
    .select('user_id, asaas_payment_id')

  const productData = products ?? []
  const paidRows = productData.filter(r => r.asaas_payment_id)
  const uniqueBuyers = new Set(paidRows.map(r => r.user_id))

  const { data: pixRows } = await service
    .from('pix_charges')
    .select('email')
    .eq('status', 'confirmed')

  const pixEmails = new Set((pixRows ?? []).map(r => r.email?.toLowerCase()).filter(Boolean))
  const buyerCount = Math.max(uniqueBuyers.size, pixEmails.size)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AdminHeader />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-7 rounded-full bg-[#52b788]" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">Enviar email para compradores</h1>
            <p className="text-sm text-gray-500 mt-0.5">{buyerCount} compradores com acesso pago</p>
          </div>
        </div>
        <EmailBroadcastForm buyerCount={buyerCount} />
      </div>
    </div>
  )
}
