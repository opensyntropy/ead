import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let code: string | null = null

  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    code = body.code
  } else {
    const form = await req.formData().catch(() => new FormData())
    code = form.get('code') as string | null
  }

  if (!code || code !== process.env.ANALYTICS_TOKEN) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
  }

  return NextResponse.json({
    access_token: code,
    token_type: 'Bearer',
    expires_in: 31536000, // 1 ano
  })
}
