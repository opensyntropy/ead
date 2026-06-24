'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useCallback, useState } from 'react'

interface Props {
  content: string
  onChange: (html: string) => void
}

export default function EmailEditor({ content, onChange }: Props) {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [imgUrl, setImgUrl] = useState('')
  const [showImgInput, setShowImgInput] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { style: 'color:#476B18;text-decoration:underline' } }),
      Image.configure({ HTMLAttributes: { style: 'max-width:100%;border-radius:8px;margin:12px 0' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[280px] p-4',
      },
    },
  })

  const applyLink = useCallback(() => {
    if (!editor) return
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    }
    setLinkUrl('')
    setShowLinkInput(false)
  }, [editor, linkUrl])

  const insertImage = useCallback(() => {
    if (!editor || !imgUrl) return
    editor.chain().focus().setImage({ src: imgUrl }).run()
    setImgUrl('')
    setShowImgInput(false)
  }, [editor, imgUrl])

  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, label: string, title?: string) => (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${active ? 'bg-[#1b4332] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center gap-1">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B', 'Negrito')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I', 'Itálico')}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U', 'Sublinhado')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1')}
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2')}
        {btn(editor.isActive('paragraph'), () => editor.chain().focus().setParagraph().run(), 'P', 'Parágrafo')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), '⬛ Esq', 'Alinhar à esquerda')}
        {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), '⬛ Centro')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '• Lista')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1. Lista')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          type="button"
          title="Inserir link"
          onClick={() => setShowLinkInput(v => !v)}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${editor.isActive('link') ? 'bg-[#1b4332] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          🔗 Link
        </button>
        <button
          type="button"
          title="Inserir imagem por URL"
          onClick={() => setShowImgInput(v => !v)}
          className="px-2 py-1 rounded text-sm font-medium hover:bg-gray-100 text-gray-700 transition-colors"
        >
          🖼 Imagem
        </button>
      </div>

      {/* Link input */}
      {showLinkInput && (
        <div className="bg-blue-50 border-b border-blue-100 px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-blue-700 font-medium whitespace-nowrap">URL do link:</span>
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyLink()}
            placeholder="https://..."
            className="flex-1 text-sm border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
            autoFocus
          />
          <button type="button" onClick={applyLink} className="text-sm bg-[#1b4332] text-white px-3 py-1 rounded hover:bg-[#2d6a4f] transition-colors">
            OK
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false) }}
              className="text-sm text-red-600 hover:text-red-800 px-2 py-1"
            >
              Remover
            </button>
          )}
        </div>
      )}

      {/* Image input */}
      {showImgInput && (
        <div className="bg-amber-50 border-b border-amber-100 px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-amber-700 font-medium whitespace-nowrap">URL da imagem:</span>
          <input
            type="url"
            value={imgUrl}
            onChange={e => setImgUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && insertImage()}
            placeholder="https://..."
            className="flex-1 text-sm border border-amber-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400"
            autoFocus
          />
          <button type="button" onClick={insertImage} className="text-sm bg-[#1b4332] text-white px-3 py-1 rounded hover:bg-[#2d6a4f] transition-colors">
            Inserir
          </button>
        </div>
      )}

      {/* Editor area */}
      <EditorContent editor={editor} className="bg-white" />
    </div>
  )
}
