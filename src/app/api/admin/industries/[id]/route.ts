import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 업종 상세
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()
    const { id } = await params

    const { data, error } = await supabase
      .from('industries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return Response.json({ success: false, error: '업종을 찾을 수 없습니다.' }, { status: 404 })

    // 하위 업종도 조회
    const { data: children } = await supabase
      .from('industries')
      .select('*')
      .eq('parent_id', id)
      .order('sort_order', { ascending: true })

    return Response.json({ success: true, data: { ...data, children: children || [] } })
  } catch (err) {
    return handleApiError(err)
  }
}

// PUT: 업종 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()
    const { id } = await params

    const body = await req.json()
    const { name, parent_id, level, sort_order, is_active } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (parent_id !== undefined) updateData.parent_id = parent_id
    if (level !== undefined) updateData.level = level
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('industries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE: 업종 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()
    const { id } = await params

    const { error } = await supabase
      .from('industries')
      .delete()
      .eq('id', id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
