'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_PASSWORD = 'sintropira123'

export async function adminLogin(formData: FormData) {
  const password = formData.get('password') as string
  if (password !== ADMIN_PASSWORD) {
    redirect('/admin/login?error=1')
  }
  const jar = await cookies()
  jar.set('admin_session', '1', { httpOnly: true, path: '/', maxAge: 60 * 60 * 8 })
  jar.set('admin_flag', '1', { httpOnly: false, path: '/', maxAge: 60 * 60 * 24 * 365 })
  redirect('/admin')
}

export async function adminLogout() {
  const jar = await cookies()
  jar.delete('admin_session')
  redirect('/admin/login')
}
