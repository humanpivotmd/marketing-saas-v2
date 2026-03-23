import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// POST: 프롬프트 활성화
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const { id } = await params
    const supabase = createServerSupabase()

    // Get the prompt to find its step
    const { data: prompt, error: fetchError } = await supabase
      .from('admin_prompts')
      .select('step')
      .eq('id', id)
      .single()

    if (fetchError || !prompt) {
      return Response.json({ error: '프롬프트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Deactivate all prompts for this step
    await supabase
      .from('admin_prompts')
      .update({ is_active: false })
      .eq('step', prompt.step)

    // Activate the selected prompt
    const { data, error } = await supabase
      .from('admin_prompts')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
