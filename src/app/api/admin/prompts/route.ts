import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 프롬프트 버전 목록
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const step = url.searchParams.get('step') || ''

    let query = supabase
      .from('admin_prompts')
      .select('*')

    if (step) query = query.eq('step', step)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ success: true, data: data || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: 새 버전 저장
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)

    const { step, prompt_text, traffic_ratio } = await req.json()

    if (!step || !prompt_text) {
      return Response.json({ error: 'step과 prompt_text는 필수입니다.' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Get max version for this step
    const { data: existing } = await supabase
      .from('admin_prompts')
      .select('version')
      .eq('step', step)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = (existing?.[0]?.version || 0) + 1

    const { data, error } = await supabase
      .from('admin_prompts')
      .insert({
        step,
        version: nextVersion,
        prompt_text,
        traffic_ratio: traffic_ratio || 100,
        is_active: false,
        created_by: authUser.userId,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
