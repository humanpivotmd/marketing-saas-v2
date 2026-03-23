import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

// PUT: 채널 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req)
    const { id } = await params
    const body = await req.json()
    const supabase = createServerSupabase()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.account_name) updates.account_name = body.account_name
    if (body.account_id) updates.account_id = body.account_id
    if (body.access_token) updates.access_token = encrypt(body.access_token)
    if (body.refresh_token) updates.refresh_token = encrypt(body.refresh_token)
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active

    const { data, error } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', id)
      .eq('user_id', authUser.userId)
      .select('id, platform, account_name, account_id, is_active, updated_at')
      .single()

    if (error || !data) {
      return Response.json({ error: '채널을 찾을 수 없습니다.' }, { status: 404 })
    }

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE: 채널 연동 해제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', id)
      .eq('user_id', authUser.userId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
