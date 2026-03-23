import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth'
import { handleApiError, AppError, ValidationError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || typeof token !== 'string') {
      throw new ValidationError('재설정 토큰이 필요합니다.')
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new ValidationError('비밀번호는 8자 이상이어야 합니다.')
    }

    const supabase = createServerSupabase()

    const { data: user } = await supabase
      .from('users')
      .select('id, reset_expires')
      .eq('reset_token', token)
      .single()

    if (!user) {
      throw new AppError('유효하지 않거나 만료된 재설정 링크입니다.', 400, 'INVALID_TOKEN')
    }

    if (user.reset_expires && new Date(user.reset_expires) < new Date()) {
      throw new AppError('재설정 링크가 만료되었습니다. 다시 요청해주세요.', 400, 'TOKEN_EXPIRED')
    }

    const passwordHash = await hashPassword(password)

    await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return Response.json({ success: true, message: '비밀번호가 재설정되었습니다.' })
  } catch (error) {
    return handleApiError(error)
  }
}
