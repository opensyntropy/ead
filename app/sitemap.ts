import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { getArticles } from '@/lib/articles'
import { getManejoChapters } from '@/lib/manejo'
import { getBiblioteca } from '@/lib/conteudo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles()
  const manejo = await getManejoChapters()
  const prateleiras = await getBiblioteca()

  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/guia-agrofloresta`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/biblioteca`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/biblioteca/especies`, changeFrequency: 'weekly', priority: 0.8 },
    ...prateleiras.map(p => ({ url: `${SITE_URL}/biblioteca/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    { url: `${SITE_URL}/artigos`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/sobre`, changeFrequency: 'yearly', priority: 0.5 },
    ...articles.map(a => ({
      url: `${SITE_URL}/artigos/${a.slug}`,
      lastModified: a.updated ?? a.date,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...manejo.map(c => ({
      url: `${SITE_URL}/manejo/${c.slug}`,
      lastModified: c.updated ?? c.date,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
