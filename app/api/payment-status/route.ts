import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createDownloadToken } from '@/lib/download'

export async function GET(request: Request) {
  const paymentId = new URL(request.url).searchParams.get('paymentId')
  if (!paymentId) return NextResponse.json({ confirmed: false })

  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('pix_charges')
    .select('status, email, product')
    .eq('asaas_payment_id', paymentId)
    .single()

  if (data?.status !== 'confirmed') return NextResponse.json({ confirmed: false })

  const token = await createDownloadToken(data.email, 'ebook')
  return NextResponse.json({ confirmed: true, downloadUrl: `/api/download?token=${token}` })
}
