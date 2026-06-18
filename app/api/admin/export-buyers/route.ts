import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const service = await createServiceClient()

  const { data, error } = await service
    .from('pix_charges')
    .select('name, email, whatsapp')
    .eq('status', 'confirmed')
    .order('confirmed_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const seen = new Set<string>()
  const rows: { name: string; email: string; phone: string }[] = []

  for (const r of data ?? []) {
    if (!r.email || seen.has(r.email.toLowerCase())) continue
    seen.add(r.email.toLowerCase())

    let phone = (r.whatsapp ?? '').replace(/\D/g, '')
    if (phone && !phone.startsWith('+')) {
      // Adiciona +55 se não tiver código de país (números BR têm 10 ou 11 dígitos)
      if (phone.length <= 11) phone = '55' + phone
      phone = '+' + phone
    }

    rows.push({
      name: r.name ?? '',
      email: r.email,
      phone,
    })
  }

  const csv = [
    'Nome,Email,Telefone',
    ...rows.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.phone}"`,
    ].join(',')),
  ].join('\r\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="compradores-pagos.csv"',
    },
  })
}
