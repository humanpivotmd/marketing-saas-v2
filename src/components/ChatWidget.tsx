'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import Button from '@/components/ui/Button'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const MIN_W = 320
const MIN_H = 400
const MAX_W = 800
const MAX_H = 900

const SUGGESTIONS = [
  '블로그 SEO 전략을 알려주세요',
  "'다이어트 식단' 키워드 분석해줘",
  '인스타 콘텐츠 아이디어 추천',
  '블로그 제목 작성 팁',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [size, setSize] = useState({ w: 380, h: 520 })
  const resizing = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onResizePointerDown = (e: ReactPointerEvent) => {
    e.preventDefault()
    resizing.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h }
    document.body.style.userSelect = 'none'
  }

  const onPointerMove = useCallback((e: globalThis.PointerEvent) => {
    if (!resizing.current) return
    const dx = resizing.current.startX - e.clientX
    const dy = resizing.current.startY - e.clientY
    setSize({
      w: Math.min(MAX_W, Math.max(MIN_W, resizing.current.startW + dx)),
      h: Math.min(MAX_H, Math.max(MIN_H, resizing.current.startH + dy)),
    })
  }, [])

  const onPointerUp = useCallback(() => {
    resizing.current = null
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || isStreaming) return

    const userMessage: Message = { role: 'user', content }
    const newMessages = [...messages, userMessage]
    setMessages([...newMessages, { role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)

    try {
      // n8n Chat Trigger webhook 호출
      const N8N_WEBHOOK = 'http://localhost:5678/webhook/120262ea-1dfb-43e6-8d72-3a50df5f67e6/chat'
      const res = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          chatInput: content,
          sessionId: 'marketing-app-session',
        }),
      })

      if (!res.ok) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'n8n 연결 오류가 발생했습니다.' }
          return updated
        })
        setIsStreaming(false)
        return
      }

      const data = await res.json()
      const output = data.output || data.text || JSON.stringify(data)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: output }
        return updated
      })
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'n8n 서버에 연결할 수 없습니다. n8n이 실행 중인지 확인하세요.' }
        return updated
      })
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        aria-label={open ? 'AI 채팅 닫기' : 'AI 채팅 열기'}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 rounded-2xl bg-bg-primary border border-[rgba(240,246,252,0.15)] shadow-2xl flex flex-col overflow-hidden animate-[fade-in_150ms_ease-out]"
          style={{ width: size.w, height: size.h, maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 8rem)' }}
        >
          {/* Resize handle (top-left corner) */}
          <div
            onPointerDown={onResizePointerDown}
            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-10 group"
            aria-label="크기 조절"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" className="absolute top-1 left-1 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
              <path d="M0 10L10 0" stroke="currentColor" strokeWidth="1.5" />
              <path d="M0 6L6 0" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Header */}
          <div className="px-4 py-3 border-b border-[rgba(240,246,252,0.1)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="2" strokeLinecap="round">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">AI 마케팅 어시스턴트</p>
              <p className="text-xs text-text-tertiary">키워드, SEO, 콘텐츠 전략</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-bg-tertiary flex items-center justify-center transition-colors text-text-secondary"
              aria-label="닫기"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm text-text-secondary mb-4">무엇이든 물어보세요</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-1.5 text-xs text-text-secondary bg-bg-tertiary rounded-full hover:bg-bg-tertiary/80 hover:text-text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent-primary text-white rounded-br-md'
                        : 'bg-bg-secondary border border-[rgba(240,246,252,0.1)] text-text-primary rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                      {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && (
                        <span className="inline-block w-1.5 h-3.5 bg-accent-primary ml-0.5 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-[rgba(240,246,252,0.1)] flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              disabled={isStreaming}
              className="flex-1 h-9 px-3 text-sm bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50"
            />
            <Button type="submit" size="sm" loading={isStreaming} disabled={!input.trim() && !isStreaming}>
              전송
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
