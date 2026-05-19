import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          backgroundColor: '#0f2318',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Left: text */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px 56px 56px 72px',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#7DC142' }} />
            <span style={{ color: '#7DC142', fontSize: 15, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              OpenSyntropy
            </span>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Guia de Introdução à
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
              <span style={{ color: '#ffffff', fontSize: 66, fontWeight: 900, letterSpacing: '-0.01em' }}>
                AGRO
              </span>
              <span style={{ color: '#ffffff', fontSize: 66, fontWeight: 900, letterSpacing: '-0.01em' }}>
                FLORESTA
              </span>
              <span style={{ color: '#7DC142', fontSize: 56, fontWeight: 900, letterSpacing: '-0.01em' }}>
                SINTRÓPICA
              </span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 18, marginTop: 12 }}>
              207 páginas · 27 capítulos · 25+ infográficos
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: 600 }}>
              Michel Bottan
            </span>
          </div>

          {/* Bottom tag */}
          <div style={{ display: 'flex' }}>
            <div style={{ backgroundColor: '#7DC142', color: '#0f2318', fontSize: 16, fontWeight: 800, padding: '12px 28px', borderRadius: 999, letterSpacing: '0.04em' }}>
              opensyntropy.com
            </div>
          </div>
        </div>

        {/* Right: book cover */}
        <div
          style={{
            width: 340,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 40px 32px 0',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${baseUrl}/capa_livro.png`}
            style={{
              height: 530,
              width: 'auto',
              borderRadius: 8,
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            }}
            alt=""
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
