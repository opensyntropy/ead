import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Domínios antigos (ex.: "www.agroflorestasintropica.com.br,agroflorestasintropica.com.br")
// que devem redirecionar em 301/308 para NEXT_PUBLIC_BASE_URL após a migração.
const LEGACY_HOSTS = (process.env.LEGACY_HOSTS ?? '')
  .split(',')
  .map(h => h.trim().toLowerCase())
  .filter(Boolean)

// /api fica fora: webhooks (Asaas/Stripe) não seguem redirect e os links de
// download já enviados por e-mail continuam válidos no domínio antigo.
function isLegacyExempt(pathname: string) {
  return pathname.startsWith('/api/') || pathname.startsWith('/.well-known/')
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = (request.headers.get('host') ?? '').toLowerCase()

  if (LEGACY_HOSTS.includes(host) && !isLegacyExempt(pathname) && process.env.NEXT_PUBLIC_BASE_URL) {
    // a raiz do domínio antigo era a página de vendas (anúncios e e-mails apontam para lá)
    const target = new URL((pathname === '/' ? '/guia-agrofloresta' : pathname) + request.nextUrl.search, process.env.NEXT_PUBLIC_BASE_URL)
    return NextResponse.redirect(target, 308)
  }

  // Protege /ebook/* (a landing /ebook é pública)
  if (!pathname.startsWith('/ebook/')) return NextResponse.next()

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  // Tudo menos assets estáticos: o redirect de domínio legado precisa ver todas as páginas.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico|js|css|pdf)$).*)'],
}
