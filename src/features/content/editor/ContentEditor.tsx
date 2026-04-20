'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'
import { useEffect } from 'react'

interface ContentEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
}

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btnBase = 'px-2 py-1.5 text-xs rounded transition-colors min-w-[32px] min-h-[32px]'
  const active = 'bg-accent-primary/20 text-accent-primary'
  const inactive = 'text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary'

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border-primary">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${btnBase} ${editor.isActive('heading', { level: 2 }) ? active : inactive}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${btnBase} ${editor.isActive('heading', { level: 3 }) ? active : inactive}`}
      >
        H3
      </button>

      <div className="w-px bg-border-primary mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${btnBase} font-bold ${editor.isActive('bold') ? active : inactive}`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${btnBase} italic ${editor.isActive('italic') ? active : inactive}`}
      >
        I
      </button>

      <div className="w-px bg-border-primary mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${btnBase} ${editor.isActive('bulletList') ? active : inactive}`}
      >
        &bull; List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${btnBase} ${editor.isActive('orderedList') ? active : inactive}`}
      >
        1. List
      </button>

      <div className="w-px bg-border-primary mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${btnBase} ${editor.isActive('blockquote') ? active : inactive}`}
      >
        &ldquo; Quote
      </button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('링크 URL:')
          if (url && /^https?:\/\//.test(url)) editor.chain().focus().setLink({ href: url }).run()
        }}
        className={`${btnBase} ${editor.isActive('link') ? active : inactive}`}
      >
        Link
      </button>
    </div>
  )
}

export default function ContentEditor({ value, onChange, placeholder }: ContentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        validate: (href) => /^https?:\/\//.test(href),
      }),
      Markdown,
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (ed.storage as any).markdown.getMarkdown() as string
      onChange(md)
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[400px] px-4 py-3 text-sm text-text-primary leading-relaxed focus:outline-none prose prose-invert prose-sm max-w-none',
      },
    },
  })

  // 외부 value 변경 시 에디터 동기화 (초기 로드)
  useEffect(() => {
    if (editor && value && !editor.isFocused) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current = (editor.storage as any).markdown.getMarkdown() as string
      if (current !== value) {
        editor.commands.setContent(value)
      }
    }
  }, [editor, value])

  return (
    <div className="border border-border-primary rounded-lg bg-bg-tertiary overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        placeholder={placeholder || '콘텐츠 본문을 편집하세요'}
      />
    </div>
  )
}
