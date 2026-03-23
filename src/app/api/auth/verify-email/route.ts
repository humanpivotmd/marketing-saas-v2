import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token || typeof token !== 'string') {
      throw new AppError('인증 토큰이 필요합니다.', 400, 'VALIDATION_ERROR')
    }

    const supabase = createServerSupabase()

    const { data: user } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('verify_token', token)
      .single()

    if (!user) {
      throw new AppError('유효하지 않거나 만료된 인증 링크입니다.', 400, 'INVALID_TOKEN')
    }

    if (user.email_verified) {
      return Response.json({ success: true, message: '이미 인증된 이메일입니다.' })
    }

    await supabase
      .from('users')
      .update({
        email_verified: true,
        verify_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return Response.json({ success: true, message: '이메일 인증이 완료되었습니다.' })
  } catch (error) {
    return handleApiError(error)
  }
}
