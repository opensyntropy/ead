'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Chapter } from '@/config/chapters'
import type { Video } from '@/config/videos'

interface ChapterWithVideos extends Chapter {
  videos: Video[]
}

interface Props {
  chapters: ChapterWithVideos[]
  hasEbook: boolean
  hasCourse: boolean
  userEmail: string
}

export default function Sidebar({ chapters, hasEbook, hasCourse, userEmail }: Props) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function toggleChapter(id: string) {
    setExpanded(prev => prev === id ? null : id)
  }

  const nav = (
    <nav className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-6 border-b border-[#b7e4c7]">
        <Link href="/ebook" className="block">
          <span className="text-[10px] tracking-widest uppercase text-[#52b788] font-medium">Plataforma EAD</span>
          <h1 className="text-base font-serif font-bold text-[#1b4332] leading-tight mt-0.5">
            Agricultura<br />Sintropica
          </h1>
        </Link>
      </div>

      {/* Chapters list */}
      <div className="flex-1 overflow-y-auto py-4">
        {!hasEbook && !hasCourse && (
          <div className="px-6 py-4">
            <p className="text-sm text-gray-500 mb-3">Você ainda não tem acesso.</p>
            <Link href="/#produtos" className="text-sm text-[#2d6a4f] font-medium underline">
              Ver planos →
            </Link>
          </div>
        )}

        {(hasEbook || hasCourse) && chapters.map(ch => {
          const chapterPath = `/ebook/${ch.id}`
          const isChapterActive = pathname === chapterPath
          const hasVideos = ch.videos.length > 0
          const isExpanded = expanded === ch.id || isChapterActive

          return (
            <div key={ch.id}>
              <div className="flex items-center group">
                <Link
                  href={hasEbook ? chapterPath : '#'}
                  onClick={() => { setOpen(false); if (hasVideos) toggleChapter(ch.id) }}
                  className={`flex-1 flex items-start gap-3 px-6 py-3 text-sm transition-colors ${
                    isChapterActive
                      ? 'bg-[#d8f3dc] text-[#1b4332] font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${!hasEbook ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-base mt-0.5">{hasEbook ? '📖' : '🔒'}</span>
                  <span className="flex-1">
                    <span className="block font-medium">Cap {ch.number}</span>
                    <span className="block text-xs text-gray-500 font-normal">{ch.title}</span>
                  </span>
                  {hasVideos && (
                    <span className="text-xs text-gray-400 self-center">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  )}
                </Link>
              </div>

              {/* Videos sub-list */}
              {isExpanded && hasVideos && ch.videos.map(v => {
                const videoPath = `/ebook/${ch.id}/video/${v.id}`
                const isVideoActive = pathname === videoPath
                return (
                  <Link
                    key={v.id}
                    href={videoPath}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 pl-14 pr-6 py-2 text-xs transition-colors ${
                      isVideoActive
                        ? 'bg-[#d8f3dc] text-[#1b4332] font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>🎥</span>
                    <span>{v.title}</span>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#b7e4c7]">
        <p className="text-xs text-gray-400 truncate mb-2">{userEmail}</p>
        <button
          onClick={handleLogout}
          className="text-xs text-[#2d6a4f] hover:text-[#1b4332] transition-colors"
        >
          Sair →
        </button>
      </div>
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-[#b7e4c7] z-30">
        {nav}
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#b7e4c7] flex items-center px-4 z-30">
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-[#1b4332] hover:bg-gray-100 rounded-lg"
          aria-label="Abrir menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 font-serif font-bold text-[#1b4332] text-sm">Agricultura Sintropica</span>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-72 bg-white h-full flex flex-col shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700"
              aria-label="Fechar menu"
            >
              ✕
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  )
}
