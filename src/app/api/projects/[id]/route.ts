import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { deleteOwnedRecord } from '@/lib/api-helpers'

// GET: 프로젝트 상세
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()
    const { id } = await params

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', authUser.userId)
      .single()

    if (error || !data) {
      return Response.json({ success: false, error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 채널별 콘텐츠도 함께 조회
    const { data: contents } = await supabase
      .from('contents')
      .select('id, channel, title, body, status, confirmed_at, metadata, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    return Response.json({ success: true, data: { ...data, contents: contents || [] } })
  } catch (err) {
    return handleApiError(err)
  }
}

// PATCH: 프로젝트 업데이트 (단계 진행, 데이터 저장)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()
    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, unknown> = {}

    // 허용 필드만 업데이트
    const allowed = [
      'current_step', 'step_status', 'topic_type', 'selected_title',
      'title_candidates', 'custom_prompt', 'prompt_mode', 'draft_content',
      'content_ids', 'status', 'confirmed_at', 'business_type', 'core_message'
    ]
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key]
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', authUser.userId)
      .select()
      .single()

    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE: 프로젝트 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return deleteOwnedRecord(req, params, 'projects')
}
