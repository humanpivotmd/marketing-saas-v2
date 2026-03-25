import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

const BUSINESS_FIELDS = [
  'business_type', 'selected_channels', 'target_audience', 'target_gender',
  'fixed_keywords', 'blog_category', 'industry_id', 'company_name',
  'service_name', 'writing_tone'
] as const

// GET: 비즈니스 프로필 조회
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('users')
      .select(BUSINESS_FIELDS.join(', '))
      .eq('id', authUser.userId)
      .single()

    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    return handleApiError(err)
  }
}

// PUT: 비즈니스 프로필 저장
export async function PUT(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()
    const body = await req.json()

    const updateData: Record<string, unknown> = {}
    for (const field of BUSINESS_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // 유효성 검사
    if (updateData.business_type && !['B2B', 'B2C'].includes(updateData.business_type as string)) {
      return Response.json({ success: false, error: 'business_type은 B2B 또는 B2C여야 합니다.' }, { status: 400 })
    }
    if (updateData.target_gender && !['male', 'female', 'all'].includes(updateData.target_gender as string)) {
      return Response.json({ success: false, error: 'target_gender가 올바르지 않습니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authUser.userId)
      .select(BUSINESS_FIELDS.join(', '))
      .single()

    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    return handleApiError(err)
  }
}
