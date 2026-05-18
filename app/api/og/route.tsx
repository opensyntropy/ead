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
          position: 'relative',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${baseUrl}/hero_capa.jpg`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          alt=""
        />

        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(10,20,5,0.88) 0%, rgba(10,20,5,0.60) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 80px',
            width: '100%',
          }}
        >
          {/* Top: brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#7DC142',
              }}
            />
            <span
              style={{
                color: '#7DC142',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              OpenSyntropy
            </span>
          </div>

          {/* Middle: title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Guia de Introdução à
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span
                style={{
                  color: '#ffffff',
                  fontSize: 80,
                  fontWeight: 900,
                  letterSpacing: '-0.01em',
                }}
              >
                AGROFLORESTA
              </span>
              <span
                style={{
                  color: '#7DC142',
                  fontSize: 68,
                  fontWeight: 900,
                  letterSpacing: '-0.01em',
                }}
              >
                SINTRÓPICA
              </span>
            </div>
            <span
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: 22,
                fontWeight: 400,
                marginTop: 8,
              }}
            >
              207 páginas · 27 capítulos · 25+ infográficos · Michel Bottan
            </span>
          </div>

          {/* Bottom: CTA pill */}
          <div style={{ display: 'flex' }}>
            <div
              style={{
                backgroundColor: '#7DC142',
                color: '#141F0C',
                fontSize: 18,
                fontWeight: 800,
                padding: '14px 32px',
                borderRadius: 999,
                letterSpacing: '0.05em',
              }}
            >
              opensyntropy.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
