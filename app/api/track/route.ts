import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { page, utm_source, utm_medium, utm_campaign } = await req.json()
    const sb = createServiceClient()
    await sb.from('page_visits').insert({ page, utm_source, utm_medium, utm_campaign })
  } catch {}
  return NextResponse.json({ ok: true })
}
