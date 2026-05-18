import { createClient } from '@/lib/supabase/server'
import { CHAPTERS, hasChapterAccess } from '@/config/chapters'
import { notFound, redirect } from 'next/navigation'
import { readFile } from 'fs/promises'
import path from 'path'
import type { Product } from '@/config/chapters'
import MarkdownReader from './MarkdownReader'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ chapterId: string }>
}

async function getUserProducts(userId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_products')
    .select('product')
    .eq('user_id', userId)
  return (data ?? []).map(r => r.product as Product)
}

export default async function ChapterPage({ params }: Props) {
  const { chapterId } = await params
  const chapter = CHAPTERS.find(c => c.id === chapterId)
  if (!chapter) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const userProducts = await getUserProducts(user.id)
  const canAccess = hasChapterAccess(userProducts, chapter)

  if (!canAccess) {
    return (
      <div className="pt-14 lg:pt-0 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-sm mx-auto px-6 py-12">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-serif font-bold text-[#1b4332] mb-2">
            Conteúdo bloqueado
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Adquira o ebook para ter acesso a este capítulo.
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

  const contentDir = path.join(process.cwd(), 'content', chapterId)
  let markdown = ''
  try {
    markdown = await readFile(path.join(contentDir, 'texto.md'), 'utf-8')
  } catch {
    markdown = `# ${chapter.title}\n\n*Conteúdo em breve.*`
  }

  // Reescreve URLs relativas de imagens no markdown para passar pela rota autenticada
  const processedMarkdown = markdown.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
    (_, alt, src) => `![${alt}](/api/content/${chapterId}/${src})`
  )

  return (
    <div className="pt-14 lg:pt-0">
      <MarkdownReader chapter={chapter} markdown={processedMarkdown} images={[]} />
    </div>
  )
}
