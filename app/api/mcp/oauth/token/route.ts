import { NextRequest, NextResponse } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

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
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400, headers: CORS })
  }

  return NextResponse.json({
    access_token: code,
    token_type: 'Bearer',
    expires_in: 31536000,
  }, { headers: CORS })
}
