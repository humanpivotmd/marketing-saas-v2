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

    // 이미지 스크립트도 함께 조회
    const { data: imageScripts } = await supabase
      .from('image_scripts')
      .select('channel, prompts, thumbnail_prompt')
      .eq('project_id', id)
      .eq('user_id', authUser.userId)

    // 영상 스크립트도 함께 조회 (최신 1개)
    const { data: videoScript } = await supabase
      .from('video_scripts')
      .select('id, title, storyboard, full_script, format, target_channel, scene_count, scene_duration')
      .eq('project_id', id)
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return Response.json({
      success: true,
      data: {
        ...data,
        contents: contents || [],
        image_scripts: imageScripts || [],
        video_script: videoScript || null,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// PATCH: 프로젝트 업데이트
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()
    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, unknown> = {}
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
