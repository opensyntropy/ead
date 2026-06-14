import { NextRequest, NextResponse } from 'next/server'

// Dynamic client registration — aceita qualquer cliente, devolve client_id fixo
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({
    client_id: 'claude-ai',
    client_secret: undefined,
    redirect_uris: body.redirect_uris ?? [],
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  })
}
