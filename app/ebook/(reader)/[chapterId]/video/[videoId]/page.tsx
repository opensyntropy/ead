import { createClient } from '@/lib/supabase/server'
import { CHAPTERS } from '@/config/chapters'
import { VIDEOS, getEmbedUrl } from '@/config/videos'
import { notFound, redirect } from 'next/navigation'
import type { Product } from '@/config/chapters'

interface Props {
  params: Promise<{ chapterId: string; videoId: string }>
}

async function getUserProducts(userId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_products')
    .select('product')
    .eq('user_id', userId)
  return (data ?? []).map(r => r.product as Product)
}

export default async function VideoPage({ params }: Props) {
  const { chapterId, videoId } = await params

  const chapter = CHAPTERS.find(c => c.id === chapterId)
  const video = VIDEOS.find(v => v.id === videoId && v.chapterId === chapterId)
  if (!chapter || !video) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const userProducts = await getUserProducts(user.id)
  const hasCourse = userProducts.some(p => p === 'course' || p === 'bundle')

  if (!hasCourse) {
    return (
      <div className="pt-14 lg:pt-0 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-sm mx-auto px-6 py-12">
          <div className="text-5xl mb-4">🎥</div>
          <h2 className="text-xl font-serif font-bold text-[#1b4332] mb-2">
            Vídeos bloqueados
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Adquira o curso em vídeo ou o bundle para acessar as aulas.
          </p>
          <a
            href="/#produtos"
            className="inline-block bg-[#1b4332] text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-[#2d6a4f] transition-colors"
          >
            Ver planos
          </a>
        </div>
      </div>
    )
  }

  const embedUrl = video.url ? getEmbedUrl(video.url) : null
  const isPortrait = video.orientation === 'portrait'

  return (
    <div className="pt-14 lg:pt-0 max-w-2xl mx-auto px-6 py-10 lg:py-14">
      <div className="mb-6">
        <span className="text-xs tracking-widest uppercase text-[#52b788] font-medium">
          Cap {chapter.number} · Vídeo
        </span>
        <h1 className="mt-2 text-2xl lg:text-3xl font-serif font-bold text-[#1b4332]">
          {video.title}
        </h1>
      </div>

      {embedUrl ? (
        <div className={isPortrait ? 'flex justify-center' : ''}>
          <div
            className="relative bg-black rounded-xl overflow-hidden shadow-lg"
            style={isPortrait
              ? { width: '100%', maxWidth: '360px', aspectRatio: '9/16' }
              : { width: '100%', aspectRatio: '16/9' }
            }
          >
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center bg-[#1b4332]/5 rounded-xl border-2 border-dashed border-[#b7e4c7]"
          style={{ aspectRatio: isPortrait ? '9/16' : '16/9', maxWidth: isPortrait ? '360px' : undefined }}
        >
          <div className="text-center py-8 px-4">
            <div className="text-4xl mb-3">🎥</div>
            <p className="text-sm font-medium text-[#1b4332]">Vídeo em breve</p>
            <p className="text-xs text-gray-400 mt-1">Esta aula estará disponível em breve.</p>
          </div>
        </div>
      )}
    </div>
  )
}
