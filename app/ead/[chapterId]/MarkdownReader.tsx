'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Chapter } from '@/config/chapters'

interface Props {
  chapter: Chapter
  markdown: string
  images: string[]  // eslint-disable-line @typescript-eslint/no-unused-vars
}

export default function MarkdownReader({ chapter, markdown, images: _images }: Props) {
  return (
    <article className="max-w-2xl mx-auto px-6 py-10 lg:py-14">
      {/* Chapter header */}
      <header className="mb-10 pb-8 border-b border-[#b7e4c7]">
        <span className="text-xs tracking-widest uppercase text-[#52b788] font-medium">
          Capítulo {chapter.number}
        </span>
        <h1 className="mt-2 text-3xl lg:text-4xl font-serif font-bold text-[#1b4332] leading-tight">
          {chapter.title}
        </h1>
        <p className="mt-2 text-lg text-[#2d6a4f] font-light">{chapter.subtitle}</p>
      </header>

      {/* Markdown content */}
      <div className="prose prose-lg prose-gray max-w-none
        [font-family:var(--font-reading,Georgia,serif)]
        prose-headings:font-serif prose-headings:text-[#1b4332]
        prose-p:text-[#1a1a1a] prose-p:leading-[1.75] prose-p:text-[1.0625rem] prose-p:text-justify
        prose-p:[font-family:var(--font-reading,Georgia,serif)]
        prose-li:text-[#1a1a1a] prose-li:[font-family:var(--font-reading,Georgia,serif)]
        prose-blockquote:[font-family:var(--font-reading,Georgia,serif)]
        prose-strong:text-[#1b4332]
        prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto
        prose-blockquote:border-[#52b788] prose-blockquote:text-[#2d6a4f]
      ">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img({ src, alt }) {
              // Images from /content-images/ are served via Next.js public or API
              return (
                <figure className="my-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={alt ?? ''}
                    className="w-full rounded-xl shadow-md"
                  />
                  {alt && (
                    <figcaption className="text-center text-sm text-gray-400 mt-2 italic">
                      {alt}
                    </figcaption>
                  )}
                </figure>
              )
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </article>
  )
}
