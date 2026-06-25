import { headers } from 'next/headers'
import { sendMetaPageView } from '@/lib/meta-pixel'
import EbookClientPage from './EbookClientPage'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.agroflorestasintropica.com.br'

function parseCookieHeader(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export default async function EbookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const hdrs = await headers()
  const params = await searchParams

  const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? hdrs.get('x-real-ip') ?? null
  const ua = hdrs.get('user-agent') ?? null
  const cookieHeader = hdrs.get('cookie') ?? ''

  const fbcCookie = parseCookieHeader(cookieHeader, '_fbc')
  const fbpCookie = parseCookieHeader(cookieHeader, '_fbp')

  const fbclid = typeof params.fbclid === 'string' ? params.fbclid : null

  // Constrói fbc: preferência pelo cookie (já validado pelo Pixel), fallback pelo fbclid da URL
  const fbc = fbcCookie ?? (fbclid ? `fb.1.${Date.now()}.${fbclid}` : null)

  // URL completa com query params para o Meta conseguir associar ao clique do anúncio
  const qs = Object.entries(params)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  const sourceUrl = `${BASE_URL}/ebook${qs ? '?' + qs : ''}`

  const eventId = crypto.randomUUID()

  // Dispara CAPI imediatamente — captura todos os visitantes,
  // independente de bloqueadores de anúncio ou saída rápida antes do JS hidratar
  sendMetaPageView({ eventId, fbc, fbp: fbpCookie, ip, userAgent: ua, sourceUrl }).catch(() => {})

  return <EbookClientPage serverEventId={eventId} />
}
