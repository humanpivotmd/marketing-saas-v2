import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 사용자 프롬프트 목록
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('user_prompts')
      .select('id, step, prompt_text, mode, created_at, updated_at')
      .eq('user_id', user.userId)
      .order('step')

    if (error) throw error

    return Response.json({ success: true, data: data || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: 프롬프트 저장 (upsert)
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const { step, prompt_text, mode } = await req.json()

    if (!step || !prompt_text?.trim()) {
      return Response.json({ success: false, error: 'step과 prompt_text는 필수입니다.' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // 기존 프롬프트 확인
    const { data: existing } = await supabase
      .from('user_prompts')
      .select('id')
      .eq('user_id', user.userId)
      .eq('step', step)
      .single()

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('user_prompts')
        .update({
          prompt_text: prompt_text.trim(),
          mode: mode || 'combine',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // 새로 삽입
      const { error } = await supabase
        .from('user_prompts')
        .insert({
          user_id: user.userId,
          step,
          prompt_text: prompt_text.trim(),
          mode: mode || 'combine',
        })

      if (error) throw error
    }

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE: 프롬프트 삭제
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const url = new URL(req.url)
    const step = url.searchParams.get('step')

    if (!step) {
      return Response.json({ success: false, error: 'step 파라미터가 필요합니다.' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('user_prompts')
      .delete()
      .eq('user_id', user.userId)
      .eq('step', step)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
