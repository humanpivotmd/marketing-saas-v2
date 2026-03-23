import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, AppError } from '@/lib/errors'
import { sendVerificationEmail, createVerifyToken } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, email_verified')
      .eq('id', authUser.userId)
      .single()

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404, 'NOT_FOUND')
    }

    if (user.email_verified) {
      return Response.json({ success: true, message: '이미 인증된 이메일입니다.' })
    }

    const { token } = createVerifyToken()

    await supabase
      .from('users')
      .update({ verify_token: token, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    await sendVerificationEmail(user.email, user.name, token)

    return Response.json({ success: true, message: '인증 메일이 재발송되었습니다.' })
  } catch (error) {
    return handleApiError(error)
  }
}
