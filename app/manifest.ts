import type { MetadataRoute } from 'next'

// Instalável no celular ("Adicionar à tela inicial"): abre como app, sem a barra do navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Guia Agrofloresta',
    short_name: 'Guia Agrofloresta',
    description: 'Manejo de agrofloresta sintrópica na prática, com aulas em vídeo. Um projeto Desperto.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF5EC',
    theme_color: '#642D48',
    lang: 'pt-BR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
