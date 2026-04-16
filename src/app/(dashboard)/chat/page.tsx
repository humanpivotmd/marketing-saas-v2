'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { authHeaders } from '@/lib/auth-client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  '블로그 SEO 전략을 알려주세요',
  "'다이어트 식단' 키워드로 콘텐츠 전략 세워줘",
  '인스타그램 콘텐츠 아이디어 추천',
  '블로그 제목 작성 팁 알려줘',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || isStreaming) return

    const userMessage: Message = { role: 'user', content }
    const newMessages = [...messages, userMessage]
    setMessages([...newMessages, { role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)

    try {
      // Trim conversation if too long
      const sendMessages = newMessages.length > 40
        ? [...newMessages.slice(0, 2), ...newMessages.slice(-38)]
        : newMessages

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ messages: sendMessages }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '요청 실패' }))
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: err.error || '오류가 발생했습니다.' }
          return updated
        })
        setIsStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6))
                if (parsed.type === 'chunk' && parsed.content) {
                  setMessages(prev => {
                    const updated = [...prev]
                    const last = updated[updated.length - 1]
                    updated[updated.length - 1] = { ...last, content: last.content + parsed.content }
                    return updated
                  })
                } else if (parsed.type === 'error') {
                  setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: 'assistant', content: parsed.message || '오류가 발생했습니다.' }
                    return updated
                  })
                }
              } catch {
                // skip
              }
            }
          }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' }
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
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="pb-4">
        <h1 className="text-xl font-bold text-text-primary">AI 마케팅 어시스턴트</h1>
        <p className="text-sm text-text-secondary mt-1">키워드 분석, 콘텐츠 전략, SEO 최적화에 대해 질문하세요.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card padding="lg" className="max-w-md w-full text-center">
              <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">무엇이든 물어보세요</h2>
              <p className="text-sm text-text-secondary mb-6">마케팅 전략, SEO, 콘텐츠 기획에 대해 AI가 도와드립니다.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="px-3 py-2 text-xs text-text-secondary bg-bg-tertiary rounded-lg hover:bg-bg-tertiary/80 hover:text-text-primary transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent-primary text-white rounded-br-md'
                    : 'bg-bg-secondary border border-[rgba(240,246,252,0.1)] text-text-primary rounded-bl-md'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.content}
                  {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && (
                    <span className="inline-block w-1.5 h-4 bg-accent-primary ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-[rgba(240,246,252,0.1)]">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={isStreaming}
          className="flex-1 h-11 px-4 text-sm bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50"
        />
        <Button type="submit" loading={isStreaming} disabled={!input.trim() && !isStreaming}>
          전송
        </Button>
      </form>
    </div>
  )
}
