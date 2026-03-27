import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { validateRequest } from '@/lib/validations'
import type { z } from 'zod'

// ── 소유권 기반 단건 조회 ──
export async function getOwnedRecord(
  req: NextRequest,
  params: Promise<{ id: string }>,
  table: string,
  options?: { select?: string }
): Promise<Response> {
  try {
    const authUser = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from(table)
      .select(options?.select || '*')
      .eq('id', id)
      .eq('user_id', authUser.userId)
      .single()

    if (error || !data) throw new NotFoundError('리소스를 찾을 수 없습니다.')
    return Response.json({ success: true, data })
  } catch (err) {
    return handleApiError(err)
  }
}

// ── 소유권 기반 업데이트 ──
export async function updateOwnedRecord(
  req: NextRequest,
  params: Promise<{ id: string }>,
  table: string,
  schema: z.ZodSchema,
  options?: { select?: string; addTimestamp?: boolean }
): Promise<Response> {
  try {
    const authUser = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()
    const body = await req.json()

    const updates = validateRequest(schema, body) as Record<string, unknown>
    const updateData: Record<string, unknown> = {
      ...updates,
      ...(options?.addTimestamp !== false ? { updated_at: new Date().toISOString() } : {}),
    }

    const { data, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', authUser.userId)
      .select(options?.select || '*')
      .single()

    if (error || !data) throw new NotFoundError('리소스를 찾을 수 없습니다.')
    return Response.json({ success: true, data })
  } catch (err) {
    return handleApiError(err)
  }
}

// ── 소유권 기반 삭제 ──
export async function deleteOwnedRecord(
  req: NextRequest,
  params: Promise<{ id: string }>,
  table: string
): Promise<Response> {
  try {
    const authUser = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', authUser.userId)

    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
