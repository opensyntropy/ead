'use client'

import { useEffect, useRef } from 'react'

// Player que obedece aos botões de tempo do texto (evento "manejo:seek").
// YouTube: API de postMessage do iframe (enablejsapi=1), sem carregar o script do YouTube.
// Arquivo próprio (mp4): <video> nativo.

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

export function VideoPlayer({ url, file, title, poster, emBreve = 'O vídeo desta aula será publicado em breve.' }: {
  url?: string; file?: string; title: string; poster?: string; emBreve?: string
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const media = useRef<HTMLVideoElement>(null)
  const id = url ? youtubeId(url) : null

  useEffect(() => {
    const onSeek = (e: Event) => {
      const t = (e as CustomEvent<number>).detail
      if (media.current) {
        media.current.currentTime = t
        media.current.play().catch(() => {})
        media.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      const win = frame.current?.contentWindow
      if (!win) return
      const send = (func: string, args: unknown[] = []) =>
        win.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
      send('seekTo', [t, true])
      send('playVideo')
      frame.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    window.addEventListener('manejo:seek', onSeek)
    return () => window.removeEventListener('manejo:seek', onSeek)
  }, [])

  if (!id && file) {
    return (
      <div className="video">
        <video ref={media} src={file} poster={poster} controls preload="metadata" playsInline title={title} />
      </div>
    )
  }

  if (!id) {
    return (
      <div className="video embreve" style={poster ? { backgroundImage: `url(${poster})` } : undefined}>
        <div>
          <strong>Vídeo em breve</strong>
          <span>{emBreve}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="video">
      <iframe
        ref={frame}
        src={`https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title}
      />
    </div>
  )
}

export function SeekButton({ seconds, children }: { seconds: number; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('manejo:seek', { detail: seconds }))}
      className="tempo"
    >
      ▶ {children}
    </button>
  )
}
