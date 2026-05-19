import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getCountryTier, getCountryLocale, getCountryCurrency } from '@/lib/geo'
import CheckoutSection from '../en/CheckoutSection'

export const metadata: Metadata = {
  title: 'Introducción a la Agroforestería Sintrópica — Ebook',
  description: 'Una guía de 27 capítulos que explica la lógica detrás del bosque — el por qué, no solo el cómo.',
  openGraph: {
    title: 'Introducción a la Agroforestería Sintrópica',
    description: 'Una guía de 27 capítulos que explica la lógica detrás del bosque.',
    images: ['/og-image.jpg'],
  },
}

const CHAPTERS = [
  'El Problema de la Agricultura Convencional',
  'Qué es la Sintropía',
  'Conceptos, Principios y Prácticas',
  'Sucesión Natural: El Calendario del Bosque',
  'Estratos: La Arquitectura Vertical del Bosque',
  'Consorcios en la Agroforestería Sintrópica',
  'El Pulso de la Poda',
  'Densidad y Diversidad',
  'Deshierbe Selectivo',
  'El Suelo como Organismo Vivo',
  'Producción de Biomasa',
  'Relación C/N: La Química de la Sucesión',
  'El Rol de las Gramíneas en el SAF',
  'Abono Verde',
  'Lee Tu Tierra Antes de Diseñar',
  'Define Tus Objetivos Antes de Elegir Especies',
  'La Caja de Herramientas Sintrópica',
  'Líneas de Plantío y Arreglo Espacial',
  'SAF Base: El Módulo Fundamental',
  'SAF + Huerta',
  'SAF para Mecanización',
  'SAF Café',
  'SAF Biodiverso',
  'Implantación: Los Primeros 12 Meses',
  'Mezcla de Semillas: Implantación de Bajo Costo y Alta Diversidad',
  'Leyendo el Sistema',
  'Es Difícil. Es Verdad. Y Vale la Pena.',
]

export default async function EsPage() {
  if (process.env.STRIPE_ENABLED !== 'true') notFound()

  const hdrs = await headers()
  const country = hdrs.get('x-vercel-ip-country')
  if (getCountryLocale(country) === 'pt') redirect('/ebook')
  const tier = getCountryTier(country)
  const currency = getCountryCurrency(country)

  return (
    <div className="min-h-screen bg-[#141F0C] text-white">

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[#7DC142] text-xs tracking-widest uppercase mb-4 font-semibold">OpenSyntropy</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-6">
            Introducción a la<br />
            <span className="text-[#7DC142]">Agroforestería</span><br />
            Sintrópica
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-8">
            Una guía de 27 capítulos que explica la <em>lógica detrás del bosque</em> — no solo las técnicas, sino el <strong>por qué</strong> detrás de cada una.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-white/50">
            {['27 capítulos', '9 infografías', 'PDF · 130 páginas', 'Escrito en portugués'].map(p => (
              <span key={p} className="bg-white/10 rounded-full px-3 py-1">{p}</span>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <Image src="/hero_capa.jpg" alt="Portada del ebook" width={320} height={420} className="rounded-2xl shadow-2xl" />
        </div>
      </section>

      {/* Language note */}
      <div className="bg-[#1b4332]/60 border-y border-[#52b788]/30 py-4 px-6">
        <p className="max-w-5xl mx-auto text-sm text-white/60 text-center">
          📘 El ebook está escrito en <strong className="text-white/80">portugués</strong>. Las 9 infografías de página completa hacen que los conceptos clave sean visualmente accesibles independientemente del idioma.
        </p>
      </div>

      {/* Transformations */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-serif font-bold text-[#7DC142] mb-8 text-center">Después de leer esta guía, podrás</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            ['🌿', 'Entender la lógica detrás del bosque — no solo las técnicas, sino por qué cada una funciona'],
            ['👁️', 'Saber leer un paisaje e identificar en qué etapa de sucesión se encuentra'],
            ['🌱', 'Planificar un consorcio productivo desde cero'],
            ['🧭', 'Sentirte seguro para dar el siguiente paso: comprar tierra, iniciar un proyecto o profundizar tu estudio'],
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
          <h2 className="text-2xl font-serif font-bold text-white mb-2">27 Capítulos</h2>
          <p className="text-white/40 text-sm mb-6">Índice completo</p>
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
          <CheckoutSection defaultTier={tier} locale="es" currency={currency} />
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-xs">
        Michel Bottan · OpenSyntropy · opensyntropy.earth
      </footer>
    </div>
  )
}
