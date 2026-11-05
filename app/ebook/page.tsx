import { permanentRedirect } from 'next/navigation'

// A landing mora em /guia-agrofloresta. /ebook continua existindo para anúncios e e-mails antigos,
// preservando fbclid/UTMs na query.
export default async function EbookRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    for (const value of Array.isArray(v) ? v : v != null ? [v] : []) qs.append(k, value)
  }
  const query = qs.toString()
  permanentRedirect(query ? `/guia-agrofloresta?${query}` : '/guia-agrofloresta')
}
