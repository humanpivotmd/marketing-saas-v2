import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { brandVoiceCreateSchema, validateRequest } from '@/lib/validations'

// is_default 설정 시 기존 default 해제 (POST/PUT 공통)
export async function clearDefaultBrandVoice(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string
): Promise<void> {
  await supabase
    .from('brand_voices')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true)
}

// GET: Brand Voice 목록
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('brand_voices')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ success: true, data: data || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: Brand Voice 생성
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(brandVoiceCreateSchema, body)
    const supabase = createServerSupabase()

    if (data.is_default) await clearDefaultBrandVoice(supabase, user.userId)

    const { data: voice, error } = await supabase
      .from('brand_voices')
      .insert({
        user_id: user.userId,
        ...data,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ success: true, data: voice }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
