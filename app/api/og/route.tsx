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
          backgroundColor: '#141F0C',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow behind cover */}
        <div
          style={{
            position: 'absolute',
            right: 180,
            top: '50%',
            width: 420,
            height: 420,
            borderRadius: '50%',
            backgroundColor: '#7DC142',
            opacity: 0.12,
            filter: 'blur(80px)',
            transform: 'translateY(-50%)',
            display: 'flex',
          }}
        />

        {/* Left: text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 0 0 80px',
            width: 560,
            gap: 0,
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#7DC142' }} />
            <span style={{ color: '#7DC142', fontSize: 14, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
              OpenSyntropy
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, marginBottom: 28 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 14 }}>
              Guia de Introdução à
            </span>
            <span style={{ color: '#ffffff', fontSize: 72, fontWeight: 900, letterSpacing: '-0.02em', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
              AGRO
            </span>
            <span style={{ color: '#ffffff', fontSize: 72, fontWeight: 900, letterSpacing: '-0.02em', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
              FLORESTA
            </span>
            <span style={{ color: '#7DC142', fontSize: 62, fontWeight: 900, letterSpacing: '-0.02em', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
              SINTRÓPICA
            </span>
          </div>

          {/* Tagline */}
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, fontFamily: 'Georgia, serif', lineHeight: 1.5, maxWidth: 400 }}>
            A lógica da agrofloresta sintrópica, explicada do começo ao fim.
          </span>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 36 }}>
            <div style={{ backgroundColor: '#7DC142', color: '#141F0C', fontSize: 14, fontWeight: 800, padding: '10px 24px', borderRadius: 999, fontFamily: 'Georgia, serif', letterSpacing: '0.04em' }}>
              207 páginas · 27 capítulos
            </div>
          </div>
        </div>

        {/* Right: book cover — dominant */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 48px 24px 0',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${baseUrl}/capa_livro.png`}
            style={{
              height: 570,
              width: 'auto',
              borderRadius: 6,
              boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            }}
            alt=""
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
