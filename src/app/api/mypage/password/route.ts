import { NextRequest } from 'next/server'
import { requireAuth, comparePassword, hashPassword } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { passwordChangeRateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

// PUT: 비밀번호 변경
export async function PUT(req: NextRequest) {
  try {
    const rateLimitRes = checkRateLimitOrRespond(req, passwordChangeRateLimit, '/api/mypage/password')
    if (rateLimitRes) return rateLimitRes

    const authUser = await requireAuth(req)
    const { current_password, new_password } = await req.json()

    if (!current_password || !new_password) {
      return Response.json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' }, { status: 400 })
    }

    if (new_password.length < 8) {
      return Response.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, { status: 400 })
    }

    if (!/[A-Za-z]/.test(new_password) || !/[0-9]/.test(new_password) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(new_password)) {
      return Response.json({ error: '비밀번호에 영문자, 숫자, 특수문자를 모두 포함해주세요.' }, { status: 400 })
    }

    if (current_password === new_password) {
      return Response.json({ error: '현재 비밀번호와 다른 비밀번호를 입력해주세요.' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Get current password hash
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', authUser.userId)
      .single()

    if (fetchError || !user) {
      return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Verify current password
    const isValid = await comparePassword(current_password, user.password_hash)
    if (!isValid) {
      return Response.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, { status: 400 })
    }

    // Hash and update new password
    const newHash = await hashPassword(new_password)
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', authUser.userId)

    if (updateError) throw updateError

    return Response.json({ success: true, message: '비밀번호가 변경되었습니다.' })
  } catch (error) {
    return handleApiError(error)
  }
}
