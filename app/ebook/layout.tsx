import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CHAPTERS } from '@/config/chapters'
import { VIDEOS } from '@/config/videos'
import type { Product } from '@/config/chapters'
import Sidebar from './Sidebar'

async function getUserProducts(userId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_products')
    .select('product')
    .eq('user_id', userId)
  return (data ?? []).map(r => r.product as Product)
}

export default async function EadLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const userProducts = await getUserProducts(user.id)
  const hasEbook = userProducts.some(p => p === 'ebook' || p === 'bundle')
  const hasCourse = userProducts.some(p => p === 'course' || p === 'bundle')

  const chaptersWithVideos = CHAPTERS.map(ch => ({
    ...ch,
    videos: hasCourse ? VIDEOS.filter(v => v.chapterId === ch.id) : [],
  }))

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        chapters={chaptersWithVideos}
        hasEbook={hasEbook}
        hasCourse={hasCourse}
        userEmail={user.email ?? ''}
      />
      <main className="flex-1 lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
