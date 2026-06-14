import { createServiceClient } from '@/lib/supabase/server'

export const PRODUCT_PRICE: Record<string, number> = {
  ebook: 87,
  course: 97,
  bundle: 127,
  session: 197,
  session_upsell: 120,
}

export function checkAuth(req: Request): boolean {
  const token = process.env.ANALYTICS_TOKEN
  if (!token) return false
  // Bearer header (Claude Code CLI) ou ?token= na URL (claude.ai web connector)
  const header = req.headers.get('authorization') === `Bearer ${token}`
  const query  = new URL(req.url).searchParams.get('token') === token
  return header || query
}

// SP midnight → UTC ISO for Supabase range queries
export function spDateToUTC(date: string, endOfDay = false): string {
  const [y, m, d] = date.split('-').map(Number)
  // SP is UTC-3 (no DST)
  const hour = endOfDay ? 27 : 3 // +3h to reach midnight SP; +27h = next day midnight - 1s
  return new Date(Date.UTC(y, m - 1, d, hour)).toISOString()
}

export function toSpDay(iso: string): string {
  return new Date(iso).toLocaleDateString('sv', { timeZone: 'America/Sao_Paulo' })
}

export function pct(num: number, den: number): number {
  return den === 0 ? 0 : Math.round((num / den) * 1000) / 10
}

export async function fetchFunnelData(from: string, to: string) {
  const sb = createServiceClient()
  const fromUTC = spDateToUTC(from)
  const toUTC   = spDateToUTC(to, true)

  const [visitsRes, clicksRes, chargesRes] = await Promise.all([
    sb.from('page_visits')
      .select('created_at,page_version')
      .eq('page', '/ebook')
      .gte('created_at', fromUTC).lte('created_at', toUTC),
    sb.from('page_visits')
      .select('created_at')
      .eq('page', '/ebook/checkout-click')
      .gte('created_at', fromUTC).lte('created_at', toUTC),
    sb.from('pix_charges')
      .select('created_at,confirmed_at,status,payment_method,product,page_version')
      .gte('created_at', fromUTC).lte('created_at', toUTC),
  ])

  return {
    visits:   visitsRes.data   ?? [],
    clicks:   clicksRes.data   ?? [],
    charges:  chargesRes.data  ?? [],
  }
}

export async function fetchUnpaidData(from: string, to: string) {
  const sb = createServiceClient()
  const fromUTC = spDateToUTC(from)
  const toUTC   = spDateToUTC(to, true)

  const [chargesRes, failedRes] = await Promise.all([
    sb.from('pix_charges')
      .select('created_at,confirmed_at,status,payment_method')
      .gte('created_at', fromUTC).lte('created_at', toUTC),
    sb.from('failed_card_attempts')
      .select('created_at,reason')
      .gte('created_at', fromUTC).lte('created_at', toUTC),
  ])

  return {
    charges: chargesRes.data ?? [],
    failed:  failedRes.data  ?? [],
  }
}

export async function fetchBySourceData(from: string, to: string) {
  const sb = createServiceClient()
  const fromUTC = spDateToUTC(from)
  const toUTC   = spDateToUTC(to, true)

  const [visitsRes, clicksRes, chargesRes] = await Promise.all([
    sb.from('page_visits')
      .select('utm_source,utm_campaign,utm_content')
      .eq('page', '/ebook')
      .gte('created_at', fromUTC).lte('created_at', toUTC),
    sb.from('page_visits')
      .select('utm_source,utm_campaign,utm_content')
      .eq('page', '/ebook/checkout-click')
      .gte('created_at', fromUTC).lte('created_at', toUTC),
    sb.from('pix_charges')
      .select('utm_source,utm_campaign,utm_content,status,product,confirmed_at')
      .gte('created_at', fromUTC).lte('created_at', toUTC),
  ])

  return {
    visits:  visitsRes.data  ?? [],
    clicks:  clicksRes.data  ?? [],
    charges: chargesRes.data ?? [],
  }
}
