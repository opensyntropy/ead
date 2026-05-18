import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createDownloadToken } from '@/lib/download'
import { sendDownloadEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Busca usuário pelo e-mail
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!user) {
    // Resposta genérica para não revelar se o e-mail existe
    return NextResponse.json({ ok: true })
  }

  // Verifica produtos comprados
  const { data: products } = await supabase
    .from('user_products')
    .select('product')
    .eq('user_id', user.id)

  if (!products?.length) {
    return NextResponse.json({ ok: true })
  }

  // Envia link para cada produto que inclua ebook
  const hasEbook = products.some(p => p.product === 'ebook' || p.product === 'bundle')
  if (hasEbook) {
    const token = await createDownloadToken(email, 'ebook')
    await sendDownloadEmail(email, token)
  }

  return NextResponse.json({ ok: true })
}
