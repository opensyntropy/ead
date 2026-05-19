import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getCountryTier, getCountryLocale, getCountryCurrency } from '@/lib/geo'
import CheckoutSection from './CheckoutSection'

export const metadata: Metadata = {
  title: 'Introduction to Syntropic Agroforestry — Ebook',
  description: 'A 27-chapter guide that explains the logic behind the forest — the why, not just the how.',
  openGraph: {
    title: 'Introduction to Syntropic Agroforestry',
    description: 'A 27-chapter guide that explains the logic behind the forest.',
    images: ['/og-image.jpg'],
  },
}

const CHAPTERS = [
  'The Problem with Conventional Agriculture',
  'What is Syntropy',
  'Concepts, Principles and Practices',
  'Natural Succession: The Forest Calendar',
  'Strata: The Vertical Architecture of the Forest',
  'Consortia in Syntropic Agroforestry',
  'The Pulse of Pruning',
  'Density and Diversity',
  'Selective Weeding',
  'The Soil as a Living Organism',
  'Biomass Production',
  'C/N Ratio: The Chemistry of Succession',
  'The Role of Grasses in the SAF',
  'Green Manure',
  'Read Your Land Before You Design',
  'Define Your Goals Before Choosing Species',
  'The Syntropic Toolbox',
  'Planting Lines and Spatial Arrangement',
  'SAF Base: The Core Module',
  'SAF + Garden',
  'SAF for Mechanization',
  'SAF Coffee',
  'Biodiverse SAF',
  'Implementation: The First 12 Months',
  'Seed Mix: Low-Cost, High-Diversity Planting',
  'Reading the System',
  "It's Hard. It's True. And It's Worth It.",
]

export default async function EnPage() {
  if (process.env.STRIPE_ENABLED !== 'true') notFound()

  const hdrs = await headers()
  const country = hdrs.get('x-vercel-ip-country')

  const locale = getCountryLocale(country)
  if (locale === 'pt') redirect('/ebook')
  if (locale === 'es') redirect('/es')

  const tier = getCountryTier(country)
  const currency = getCountryCurrency(country)

  return (
    <div className="min-h-screen bg-[#141F0C] text-white">

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[#7DC142] text-xs tracking-widest uppercase mb-4 font-semibold">OpenSyntropy</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-6">
            Introduction to<br />
            <span className="text-[#7DC142]">Syntropic</span><br />
            Agroforestry
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-8">
            A 27-chapter guide that explains the <em>logic behind the forest</em> — not just the techniques, but the <strong>why</strong> behind each one.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-white/50">
            {['27 chapters', '9 infographics', 'PDF · 130 pages', 'Written in Portuguese'].map(p => (
              <span key={p} className="bg-white/10 rounded-full px-3 py-1">{p}</span>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <Image src="/hero_capa.jpg" alt="Ebook cover" width={320} height={420} className="rounded-2xl shadow-2xl" />
        </div>
      </section>

      {/* Language note */}
      <div className="bg-[#1b4332]/60 border-y border-[#52b788]/30 py-4 px-6">
        <p className="max-w-5xl mx-auto text-sm text-white/60 text-center">
          📘 The ebook is written in <strong className="text-white/80">Portuguese</strong>. The 9 full-page infographics make the core concepts visually accessible regardless of language.
        </p>
      </div>

      {/* Transformations */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-serif font-bold text-[#7DC142] mb-8 text-center">After reading this guide, you will</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            ['🌿', 'Understand the logic behind the forest — not just the techniques, but why each one works'],
            ['👁️', "Know how to read a landscape and identify what succession stage it's in"],
            ['🌱', 'Be able to plan a productive consortium from the ground up'],
            ['🧭', "Feel confident to take the next step: buy land, start a project, or deepen your study"],
          ].map(([icon, text]) => (
            <div key={text} className="flex gap-4 bg-white/5 rounded-xl p-5">
              <span className="text-2xl">{icon}</span>
              <p className="text-white/80 leading-relaxed text-sm">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TOC + Checkout */}
      <section id="checkout" className="max-w-5xl mx-auto px-6 pb-16 flex flex-col md:flex-row gap-12 items-start">
        <div className="flex-1">
          <h2 className="text-2xl font-serif font-bold text-white mb-2">27 Chapters</h2>
          <p className="text-white/40 text-sm mb-6">Complete table of contents</p>
          <ol className="space-y-1">
            {CHAPTERS.map((ch, i) => (
              <li key={i} className="flex gap-3 text-sm text-white/60">
                <span className="text-[#476B18] font-mono w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                {ch}
              </li>
            ))}
          </ol>
        </div>
        <div className="md:sticky md:top-8">
          <CheckoutSection defaultTier={tier} locale="en" currency={currency} />
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-xs">
        Michel Bottan · OpenSyntropy · opensyntropy.earth
      </footer>
    </div>
  )
}
