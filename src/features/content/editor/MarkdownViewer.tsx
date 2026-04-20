'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'

interface MarkdownViewerProps {
  content: string
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        validate: (href) => /^https?:\/\//.test(href),
      }),
      Markdown,
    ],
    content: content || '내용이 없습니다.',
    editable: false,
    editorProps: {
      attributes: {
        class:
          'text-sm text-text-primary leading-relaxed prose prose-invert prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-accent-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-accent-primary [&_a]:underline',
      },
    },
  })

  return <EditorContent editor={editor} />
}
