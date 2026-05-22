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
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#141F0C',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${baseUrl}/capa_livro.png`}
          style={{ height: 620, width: 'auto' }}
          alt=""
        />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
