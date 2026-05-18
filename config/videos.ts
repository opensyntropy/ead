export type VideoOrientation = 'landscape' | 'portrait'

export interface Video {
  id: string
  chapterId: string
  title: string
  url: string | null  // null = placeholder "em breve"
  orientation: VideoOrientation
  order: number
}

// Adicione vídeos aqui quando tiver as URLs. url: null mostra placeholder.
export const VIDEOS: Video[] = [
  // Exemplo:
  // {
  //   id: 'v-cap02-01',
  //   chapterId: 'cap02',
  //   title: 'Aula 2.1 – O que é Sintropia',
  //   url: 'https://www.youtube.com/watch?v=SEU_VIDEO_ID',
  //   orientation: 'landscape',
  //   order: 1,
  // },
]

export function getVideosByChapter(chapterId: string): Video[] {
  return VIDEOS.filter(v => v.chapterId === chapterId).sort((a, b) => a.order - b.order)
}

export function extractVideoId(url: string): { platform: 'youtube' | 'vimeo'; id: string } | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) return { platform: 'youtube', id: ytMatch[1] }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return { platform: 'vimeo', id: vimeoMatch[1] }

  return null
}

export function getEmbedUrl(url: string): string | null {
  const parsed = extractVideoId(url)
  if (!parsed) return null
  if (parsed.platform === 'youtube') return `https://www.youtube.com/embed/${parsed.id}`
  return `https://player.vimeo.com/video/${parsed.id}`
}
