import { CHAPTERS } from '@/config/chapters'
import { notFound } from 'next/navigation'
import { readFile } from 'fs/promises'
import path from 'path'
import MarkdownReader from '@/app/ead/[chapterId]/MarkdownReader'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ chapterId: string }>
}

export default async function PreviewPage({ params }: Props) {
  const { chapterId } = await params
  const chapter = CHAPTERS.find(c => c.id === chapterId)
  if (!chapter) notFound()

  const contentDir = path.join(process.cwd(), 'content', chapterId)
  let markdown = ''
  try {
    markdown = await readFile(path.join(contentDir, 'texto.md'), 'utf-8')
  } catch {
    markdown = `# ${chapter.title}\n\n*Conteúdo em breve.*`
  }

  const processedMarkdown = markdown.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
    (_, alt, src) => `![${alt}](/api/preview-image/${chapterId}/${src})`
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700">
        Modo preview — sem autenticação
      </div>
      <MarkdownReader chapter={chapter} markdown={processedMarkdown} images={[]} />
    </div>
  )
}
