// Puxa o gasto de anúncios (Meta Marketing API) para descontar do lucro.
// Filtra campanhas cujo nome contém META_ADS_CAMPAIGN_FILTER (padrão "ebook").
// Degrada com elegância: sem token/conta configurados, retorna null.
import { toSpDay } from './analytics'

const GRAPH = 'https://graph.facebook.com/v20.0'
const FILTER = (process.env.META_ADS_CAMPAIGN_FILTER ?? 'ebook').toLowerCase()

// Cache em memória por janela (since|until) — evita bater na API a cada load.
const TTL_MS = 30 * 60 * 1000
const cache = new Map<string, { data: AdInsights; at: number }>()

type InsightRow = { campaign_name?: string; spend?: string; impressions?: string; clicks?: string }

export type AdInsights = { spend: number; impressions: number; clicks: number }

/**
 * Soma gasto (BRL), impressões e cliques das campanhas do ebook no intervalo
 * [fromISO, toISO). Retorna null se não configurado ou a API falhar.
 */
export async function fetchEbookAdInsights(fromISO: string, toISO: string): Promise<AdInsights | null> {
  const token = process.env.META_ADS_ACCESS_TOKEN || process.env.META_PIXEL_ACCESS_TOKEN
  const account = process.env.META_AD_ACCOUNT_ID
  if (!token || !account) return null

  const since = toSpDay(fromISO)
  const until = toSpDay(toISO)
  const key = `${account}|${since}|${until}|${FILTER}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data

  try {
    let url: string | null =
      `${GRAPH}/act_${account}/insights?level=campaign` +
      `&fields=campaign_name,spend,impressions,clicks` +
      `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}` +
      `&limit=500&access_token=${token}`

    let spend = 0, impressions = 0, clicks = 0
    let pages = 0
    while (url && pages < 10) {
      const res: Response = await fetch(url, { cache: 'no-store' })
      const json: { data?: InsightRow[]; paging?: { next?: string }; error?: unknown } = await res.json()
      if (json.error) {
        console.error('[meta-ads] insights error:', JSON.stringify(json.error))
        return null
      }
      for (const row of json.data ?? []) {
        if ((row.campaign_name ?? '').toLowerCase().includes(FILTER)) {
          spend += parseFloat(row.spend ?? '0') || 0
          impressions += parseInt(row.impressions ?? '0', 10) || 0
          clicks += parseInt(row.clicks ?? '0', 10) || 0
        }
      }
      url = json.paging?.next ?? null
      pages++
    }

    const data: AdInsights = { spend: Math.round(spend * 100) / 100, impressions, clicks }
    cache.set(key, { data, at: Date.now() })
    return data
  } catch (e) {
    console.error('[meta-ads] fetch falhou:', e instanceof Error ? e.message : e)
    return null
  }
}
