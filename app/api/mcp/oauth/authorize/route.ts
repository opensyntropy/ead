import { NextRequest, NextResponse } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const redirect_uri          = p.get('redirect_uri')          ?? ''
  const state                 = p.get('state')                 ?? ''
  const code_challenge        = p.get('code_challenge')        ?? ''
  const code_challenge_method = p.get('code_challenge_method') ?? ''

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Opensyntropy Analytics — Acesso</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#fff;border-radius:12px;padding:2rem;max-width:380px;width:100%;box-shadow:0 2px 12px rgba(0,0,0,.1)}
    h1{font-size:1.1rem;font-weight:700;margin-bottom:.25rem}
    p{font-size:.85rem;color:#666;margin-bottom:1.5rem}
    label{font-size:.8rem;font-weight:600;display:block;margin-bottom:.4rem}
    input[type=password]{width:100%;padding:.6rem .8rem;border:1.5px solid #ddd;border-radius:8px;font-size:.9rem;outline:none}
    input[type=password]:focus{border-color:#7DC142}
    button{margin-top:1rem;width:100%;padding:.7rem;background:#7DC142;color:#141F0C;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.95rem}
    button:hover{opacity:.9}
  </style>
</head>
<body>
  <div class="card">
    <h1>Opensyntropy Analytics</h1>
    <p>Digite o token de acesso para conectar o Claude ao painel de analytics.</p>
    <form method="POST">
      <input type="hidden" name="redirect_uri"          value="${redirect_uri}">
      <input type="hidden" name="state"                 value="${state}">
      <input type="hidden" name="code_challenge"        value="${code_challenge}">
      <input type="hidden" name="code_challenge_method" value="${code_challenge_method}">
      <label for="token">Token</label>
      <input id="token" name="token" type="password" placeholder="cole o token aqui" autocomplete="off" required>
      <button type="submit">Autorizar</button>
    </form>
  </div>
</body>
</html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html', ...CORS } })
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const token        = form.get('token')        as string
  const redirect_uri = form.get('redirect_uri') as string
  const state        = form.get('state')        as string

  if (!token || token !== process.env.ANALYTICS_TOKEN) {
    return new NextResponse('Token inválido', { status: 401, headers: CORS })
  }

  const url = new URL(redirect_uri)
  url.searchParams.set('code', token)
  if (state) url.searchParams.set('state', state)

  // 302 para que o browser faça GET no callback (não mantém POST como 307)
  return NextResponse.redirect(url.toString(), { status: 302, headers: CORS })
}
