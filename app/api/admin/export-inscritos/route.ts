import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getInscritos } from '@/lib/inscritos'

export const dynamic = 'force-dynamic'

const cel = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`

export async function GET() {
  const jar = await cookies()
  if (jar.get('admin_session')?.value !== '1') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  let inscritos
  try {
    inscritos = await getInscritos()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
  const csv = [
    'Email,WhatsApp,Origem,Inscrito em,Saiu do e-mail em',
    ...inscritos.map(i => [
      cel(i.email),
      cel(i.whatsapp ? `+${i.whatsapp}` : ''),
      cel(i.origem),
      cel(i.created_at),
      cel(i.email_descadastrado_em),
    ].join(',')),
  ].join('\r\n')

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inscritos-videos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
