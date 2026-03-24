import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { comparePassword, signToken } from '@/lib/auth'
import { validateRequest, loginSchema } from '@/lib/validations'
import { handleApiError, AppError } from '@/lib/errors'
import { checkRateLimitOrRespond, loginRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const rateLimited = checkRateLimitOrRespond(req, loginRateLimit, '/api/auth/login')
    if (rateLimited) return rateLimited

    const body = await req.json()
    const { email, password } = validateRequest(loginSchema, body)

    const supabase = createServerSupabase()

    const { data: user } = await supabase
      .from('users')
      .select('id, email, password_hash, name, role, status, onboarding_done, plan_id, email_verified')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) {
      throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401, 'INVALID_CREDENTIALS')
    }

    if (user.status === 'suspended') {
      throw new AppError('계정이 정지되었습니다. 고객센터에 문의해주세요.', 403, 'ACCOUNT_SUSPENDED')
    }

    const valid = await comparePassword(password, user.password_hash)
    if (!valid) {
      throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401, 'INVALID_CREDENTIALS')
    }

    // Get plan name
    let planName = 'free'
    if (user.plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('name')
        .eq('id', user.plan_id)
        .single()
      if (plan) planName = plan.name
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: planName,
    })

    // Update last_login_at
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: planName,
        onboarding_done: user.onboarding_done,
      },
      session: {
        access_token: token,
        expires_at: expiresAt,
      },
    })

    // HttpOnly 쿠키로 JWT 설정 (XSS 방어)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    return handleApiError(error)
  }
}
