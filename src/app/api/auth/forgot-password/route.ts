import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/errors'
import { checkRateLimitOrRespond, forgotPasswordRateLimit } from '@/lib/rate-limit'
import { sendResetEmail, createResetToken } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const rateLimited = checkRateLimitOrRespond(req, forgotPasswordRateLimit, '/api/auth/forgot-password')
    if (rateLimited) return rateLimited

    const { email } = await req.json()

    // Always return success to prevent email enumeration
    const successResponse = Response.json({
      success: true,
      message: '등록된 이메일이라면 비밀번호 재설정 링크가 발송됩니다.',
    })

    if (!email || typeof email !== 'string') return successResponse

    const supabase = createServerSupabase()

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) return successResponse

    const { token, expires } = createResetToken()

    await supabase
      .from('users')
      .update({
        reset_token: token,
        reset_expires: expires.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    sendResetEmail(user.email, user.name, token).catch(console.error)

    return successResponse
  } catch (error) {
    return handleApiError(error)
  }
}
