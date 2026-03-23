import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { accountDeleteRateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

// DELETE: 계정 삭제
export async function DELETE(req: NextRequest) {
  try {
    const rateLimitRes = checkRateLimitOrRespond(req, accountDeleteRateLimit, '/api/mypage/account')
    if (rateLimitRes) return rateLimitRes

    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    // Soft delete: set status to 'suspended' and anonymize
    const { error } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        name: '탈퇴한 사용자',
        email: `deleted_${authUser.userId}@deleted.local`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.userId)

    if (error) throw error

    return Response.json({ success: true, message: '계정이 삭제되었습니다.' })
  } catch (error) {
    return handleApiError(error)
  }
}
