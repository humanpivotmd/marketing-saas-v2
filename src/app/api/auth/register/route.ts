import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth'
import { validateRequest, registerSchema } from '@/lib/validations'
import { handleApiError, AppError } from '@/lib/errors'
import { checkRateLimitOrRespond, registerRateLimit } from '@/lib/rate-limit'
import { sendVerificationEmail, createVerifyToken } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const rateLimited = checkRateLimitOrRespond(req, registerRateLimit, '/api/auth/register')
    if (rateLimited) return rateLimited

    const body = await req.json()
    const { email, password, name } = validateRequest(registerSchema, body)

    const supabase = createServerSupabase()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      throw new AppError('이미 가입된 이메일입니다.', 409, 'EMAIL_EXISTS')
    }

    const passwordHash = await hashPassword(password)
    const { token: verifyToken } = createVerifyToken()

    // Get free plan
    const { data: freePlan } = await supabase
      .from('plans')
      .select('id')
      .eq('name', 'free')
      .single()

    const username = email.toLowerCase().split('@')[0]

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        username,
        password_hash: passwordHash,
        name,
        role: 'user',
        status: 'active',
        email_verified: false,
        verify_token: verifyToken,
        plan_id: freePlan?.id || null,
        onboarding_done: false,
        experience_level: 'beginner',
      })
      .select('id, email, name')
      .single()

    if (error) {
      throw new AppError('회원가입 처리 중 오류가 발생했습니다.', 500, 'REGISTER_FAILED')
    }

    // Send verification email (non-blocking)
    sendVerificationEmail(email, name, verifyToken).catch(console.error)

    return Response.json({
      success: true,
      message: '인증 메일이 발송되었습니다.',
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
