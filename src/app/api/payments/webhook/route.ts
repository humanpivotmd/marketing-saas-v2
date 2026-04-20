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
        // 자동결제 키 비활성화 시 → 무료 플랜으로 다운그레이드
        const { status: billingStatus, customerKey } = data
        if (billingStatus === 'EXPIRED' || billingStatus === 'STOPPED') {
          // customerKey로 payments 테이블에서 user_id 조회 (직접 매핑 금지)
          let userId: string | null = null
          if (customerKey) {
            const { data: payment } = await supabase
              .from('payments')
              .select('user_id')
              .eq('payment_key', customerKey)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
            userId = payment?.user_id || null
          }
          if (userId) {
            // free 플랜 조회
            const { data: freePlan } = await supabase
              .from('plans')
              .select('id')
              .eq('name', 'free')
              .single()

            if (freePlan) {
              await supabase
                .from('users')
                .update({
                  plan_id: freePlan.id,
                  plan_expires_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', userId)

              // 감사 로그: 자동 다운그레이드 기록
              try {
                await supabase.from('action_logs').insert({
                  admin_id: userId,
                  target_user_id: userId,
                  action: 'status_change',
                  metadata: { trigger: 'billing_key_expired', billing_status: billingStatus, downgraded_to: 'free' },
                })
              } catch {
                // 로그 실패는 비치명적
              }
            }

            // 사용자에게 이메일 알림 (비치명적)
            try {
              const { data: user } = await supabase
                .from('users')
                .select('email, name')
                .eq('id', userId)
                .single()

              if (user?.email) {
                const { sendBillingFailureEmail } = await import('@/lib/email')
                await sendBillingFailureEmail(user.email, user.name || '회원')
              }
            } catch {
              // 이메일 실패는 비치명적
            }
          }
        }
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
