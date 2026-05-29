import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const jar = await cookies()
  if (jar.get('admin_session')?.value === '1' || jar.get('admin_flag')?.value === '1') {
    return NextResponse.json({ ok: true })
  }
  try {
    const { page, utm_source, utm_medium, utm_campaign, utm_term, utm_content, referer, ab_variant } = await req.json()
    const sb = createServiceClient()
    await sb.from('page_visits').insert({ page, utm_source, utm_medium, utm_campaign, utm_term: utm_term || null, utm_content: utm_content || null, referer: referer || null, ab_variant: ab_variant || null })
  } catch {}
  return NextResponse.json({ ok: true })
}
