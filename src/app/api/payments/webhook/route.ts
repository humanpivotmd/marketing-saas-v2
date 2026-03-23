import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createServerSupabase } from '@/lib/supabase/server'

// 웹훅 시그니처 검증
function verifyWebhookSignature(signature: string | null, rawBody: string): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET
  if (!secret) {
    // 시크릿 미설정 시 개발 환경에서만 통과
    return process.env.NODE_ENV !== 'production'
  }
  if (!signature) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

// POST: 토스페이먼츠 웹훅 수신
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // 웹훅 시그니처 검증
    const signature = req.headers.get('toss-signature')
    if (!verifyWebhookSignature(signature, rawBody)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const { eventType, data } = body

    const supabase = createServerSupabase()

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED': {
        const { paymentKey, status } = data
        if (paymentKey && status) {
          // 멱등성: 이미 같은 상태면 스킵
          const newStatus = status === 'DONE' ? 'completed' : 'failed'
          const { data: existing } = await supabase
            .from('payments')
            .select('status')
            .eq('payment_key', paymentKey)
            .single()

          if (existing && existing.status !== newStatus) {
            await supabase
              .from('payments')
              .update({ status: newStatus })
              .eq('payment_key', paymentKey)
          }
        }
        break
      }

      case 'BILLING_KEY_STATUS_CHANGED': {
        // 자동결제 키 상태 변경
        // 구독 갱신 실패 시 사용자 알림 등 처리
        break
      }

      case 'REFUND_STATUS_CHANGED': {
        const { paymentKey: refundKey } = data
        if (refundKey) {
          const { data: existing } = await supabase
            .from('payments')
            .select('status')
            .eq('payment_key', refundKey)
            .single()

          if (existing && existing.status !== 'refunded') {
            await supabase
              .from('payments')
              .update({ status: 'refunded' })
              .eq('payment_key', refundKey)
          }
        }
        break
      }

      default:
        console.log('[Webhook] Unknown event:', eventType)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[Webhook Error]', error)
    return Response.json({ success: true }) // 웹훅은 항상 200 반환
  }
}
