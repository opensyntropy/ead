import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ProductId } from '@/config/products'

async function checkAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).single()
  return !!data
}

// POST: adicionar acesso manual
export async function POST(request: Request) {
  if (!await checkAdmin()) return new NextResponse('Forbidden', { status: 403 })

  const { email, product } = await request.json() as { email: string; product: ProductId }
  const service = await createServiceClient()

  // Garante usuário existente
  const { data: { users } } = await service.auth.admin.listUsers()
  let userId = users.find(u => u.email === email)?.id

  if (!userId) {
    const { data: newUser, error } = await service.auth.admin.createUser({
      email,
      email_confirm: true,
    })
    if (error || !newUser.user) {
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }
    userId = newUser.user.id

    await service.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/ebook` },
    })
  }

  const { error } = await service
    .from('user_products')
    .upsert({ user_id: userId, product }, { onConflict: 'user_id,product' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE: revogar acesso
export async function DELETE(request: Request) {
  if (!await checkAdmin()) return new NextResponse('Forbidden', { status: 403 })

  const { id } = await request.json() as { id: string }
  const service = await createServiceClient()
  const { error } = await service.from('user_products').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
