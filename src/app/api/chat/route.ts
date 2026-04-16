import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { getClientIp, rateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

// 챗봇 전용 rate limit: 1시간 20회
const chatRateLimit = rateLimit(3600000, 20)

const N8N_WEBHOOK = 'http://localhost:5678/webhook/120262ea-1dfb-43e6-8d72-3a50df5f67e6/chat'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)

    // 어드민은 제한 없음
    if (!['admin', 'super_admin'].includes(user.role)) {
      const rateLimited = checkRateLimitOrRespond(req, chatRateLimit, '/api/chat')
      if (rateLimited) return rateLimited
    }

    const { message } = await req.json()
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ error: '메시지를 입력해주세요.' }, { status: 400 })
    }

    // n8n webhook 호출
    const n8nRes = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendMessage',
        chatInput: message.trim(),
        sessionId: `user-${user.userId}`,
      }),
    })

    if (!n8nRes.ok) {
      return Response.json({ error: 'AI 서비스 연결 오류' }, { status: 502 })
    }

    const data = await n8nRes.json()
    const output = data.output || data.text || JSON.stringify(data)

    const ip = getClientIp(req)
    const remaining = 20 - (chatRateLimit(ip, '/api/chat') ? 0 : 20)

    return Response.json({
      success: true,
      output,
      remaining,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
