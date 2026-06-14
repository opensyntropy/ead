import { NextResponse } from 'next/server'

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ead.opensyntropy.earth'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET() {
  return NextResponse.json({
    issuer: BASE,
    authorization_endpoint: `${BASE}/api/mcp/oauth/authorize`,
    token_endpoint:         `${BASE}/api/mcp/oauth/token`,
    registration_endpoint:  `${BASE}/api/mcp/oauth/register`,
    response_types_supported:             ['code'],
    grant_types_supported:                ['authorization_code'],
    code_challenge_methods_supported:     ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  }, { headers: CORS })
}
