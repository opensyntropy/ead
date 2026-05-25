import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { ProductId } from '@/config/products'
import { createDownloadToken } from '@/lib/download'
import { sendDownloadEmail } from '@/lib/email'

async function checkAdmin(): Promise<boolean> {
  const jar = await cookies()
  return jar.get('admin_session')?.value === '1'
}

// POST: adicionar acesso manual
export async function POST(request: Request) {
  if (!await checkAdmin()) return new NextResponse('Forbidden', { status: 403 })

  const { email, product, name, manual_paid } = await request.json() as { email: string; product: ProductId; name?: string; manual_paid?: boolean }
  const service = await createServiceClient()

  // Cria ou encontra usuário
  let userId: string | null = null
  const { data: newUser, error: createError } = await service.auth.admin.createUser({ email, email_confirm: true })
  if (createError) {
    const { data: list } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
    userId = list?.users?.find(u => u.email === email)?.id ?? null
  } else {
    userId = newUser.user?.id ?? null
  }

  if (!userId) return NextResponse.json({ error: 'Erro ao criar/encontrar usuário' }, { status: 500 })

  const { error } = await service
    .from('user_products')
    .upsert(
      { user_id: userId, product, ...(name ? { name } : {}), manual_paid: manual_paid ?? false },
      { onConflict: 'user_id,product' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Envia email de download
  let emailError: string | null = null
  if (product === 'ebook' || product === 'bundle') {
    try {
      const token = await createDownloadToken(email, 'ebook')
      await sendDownloadEmail(email, token)
    } catch (emailErr) {
      emailError = emailErr instanceof Error ? emailErr.message : String(emailErr)
      console.error('Erro ao enviar email de download:', emailError)
    }
  }

  return NextResponse.json({ ok: true, emailError })
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
