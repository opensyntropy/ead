import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { sendMetaPageView } from '@/lib/meta-pixel'
import { SITE_URL, SITE_NAME, AUTHOR, AUTHOR_LINKS, EBOOK_TITLE, EBOOK_PRICE_BRL, EBOOK_ISBN } from '@/lib/site'
import EbookClientPage from '../ebook/EbookClientPage'
import { FAQ_ITEMS } from '../ebook/faq'

export const dynamic = 'force-dynamic'

const TITLE = 'Livro de Agrofloresta Sintrópica (Ebook PDF) | Michel Bottan'
const DESCRIPTION = 'Livro digital de agrofloresta sintrópica: do conceito ao projeto de SAF, com sucessão natural, estratos, consórcios, poda e implantação. 207 páginas, 27 capítulos e 25+ infográficos.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/guia-agrofloresta' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/guia-agrofloresta',
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Book',
      '@id': `${SITE_URL}/#book`,
      name: EBOOK_TITLE,
      alternateName: 'Livro de Agrofloresta Sintrópica',
      description: DESCRIPTION,
      url: `${SITE_URL}/guia-agrofloresta`,
      image: `${SITE_URL}/capa_livro.png`,
      inLanguage: 'pt-BR',
      bookFormat: 'https://schema.org/EBook',
      numberOfPages: 207,
      author: { '@id': `${SITE_URL}/#author` },
      publisher: { '@type': 'Organization', name: SITE_NAME },
      about: ['Agrofloresta sintrópica', 'Agricultura sintrópica', 'Sistemas agroflorestais', 'Ernst Götsch'],
      genre: 'Agricultura',
      ...(EBOOK_ISBN && { isbn: EBOOK_ISBN }),
      offers: {
        '@type': 'Offer',
        price: EBOOK_PRICE_BRL,
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/guia-agrofloresta`,
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'BR',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 7,
          returnFees: 'https://schema.org/FreeReturn',
        },
      },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#author`,
      name: AUTHOR,
      url: `${SITE_URL}/sobre`,
      image: `${SITE_URL}/michel.jpg`,
      ...(AUTHOR_LINKS.length && { sameAs: AUTHOR_LINKS }),
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ],
}

function parseCookieHeader(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export default async function GuiaAgroflorestaPage({
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
  // Usa o host real da requisição para o Meta atribuir ao domínio certo durante a migração
  const host = hdrs.get('host')
  const origin = host ? `https://${host}` : SITE_URL
  const sourceUrl = `${origin}/guia-agrofloresta${qs ? '?' + qs : ''}`

  const eventId = crypto.randomUUID()

  // Dispara CAPI imediatamente — captura todos os visitantes,
  // independente de bloqueadores de anúncio ou saída rápida antes do JS hidratar
  sendMetaPageView({ eventId, fbc, fbp: fbpCookie, ip, userAgent: ua, sourceUrl }).catch(() => {})

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <EbookClientPage serverEventId={eventId} />
    </>
  )
}
