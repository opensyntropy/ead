import { createServiceClient } from '@/lib/supabase/server'
import { sendMetaPageView } from '@/lib/meta-pixel'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const jar = await cookies()
  if (jar.get('admin_session')?.value === '1' || jar.get('admin_flag')?.value === '1') {
    return NextResponse.json({ ok: true })
  }
  try {
    const { page, utm_source, utm_medium, utm_campaign, utm_term, utm_content, referer, page_version, event_id, fbc, fbp } = await req.json()
    const sb = createServiceClient()
    await sb.from('page_visits').insert({ page, utm_source, utm_medium, utm_campaign, utm_term: utm_term || null, utm_content: utm_content || null, referer: referer || null, page_version: page_version || null })

    if (page === '/ebook' && event_id) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? null
      const userAgent = req.headers.get('user-agent')
      sendMetaPageView({
        eventId: event_id,
        fbc: fbc || null,
        fbp: fbp || null,
        ip,
        userAgent,
        sourceUrl: 'https://www.agroflorestasintropica.com.br/ebook',
      }).catch(() => {})
    }
  } catch {}
  return NextResponse.json({ ok: true })
}
